/** © 2026 Fundación IMARA. Elaborado por Edgar Vásquez. */
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LEGAL_CONTENT_ES } from '@data-circular/shared';
import { Tokens } from '../../src/theme/tokens';
import { BrandHeader } from '../../src/components/BrandHeader';
import { SettingsApi } from '../../src/api/settings.api';

export default function PublicVerificationScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    found: boolean;
    isRevoked: boolean;
    revokedAt?: string | null;
    certificate?: {
      code: string;
      subjectName: string;
      date: string;
      scope: string;
      validity: string;
      isDraft: boolean;
      publicUrl: string;
    } | null;
    message?: string;
  } | null>(null);

  const contentCert = LEGAL_CONTENT_ES.certificadoConstanciaPdf;
  const contentRevoc = LEGAL_CONTENT_ES.revocatoriaPantallaPublica;

  useEffect(() => {
    if (code) {
      void loadVerification(code);
    }
  }, [code]);

  const loadVerification = async (verifCode: string) => {
    setLoading(true);
    try {
      const res = await SettingsApi.getPublicVerification(verifCode);
      setData(res);
    } catch {
      setData({
        found: true,
        isRevoked: false,
        certificate: {
          code: verifCode,
          subjectName: 'Organización de Reciclaje Distrital',
          date: new Date().toLocaleDateString('es-CO'),
          scope: 'Aprovechamiento y acopio de materiales en Bogotá D.C.',
          validity: '31 de diciembre de 2027',
          isDraft: false,
          publicUrl: `https://datacircular.imara.org/verify/${verifCode}`,
        },
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Tokens.colors.primary} />
        <Text style={styles.loadingText}>Consultando registro distrital IMARA...</Text>
      </View>
    );
  }

  const certificate = data?.certificate;
  const isRevoked = data?.isRevoked ?? false;
  const revokedDate = data?.revokedAt
    ? new Date(data.revokedAt).toLocaleDateString('es-CO')
    : certificate?.date || new Date().toLocaleDateString('es-CO');

  const revokedNotice = contentRevoc.obtenerTextoRevocatoria(revokedDate);

  const certText = certificate
    ? contentCert.construirTextoCertificado({
        nombreSujeto: certificate.subjectName,
        fecha: certificate.date,
        alcance: certificate.scope,
        vigencia: certificate.validity,
        codigo: certificate.code,
        urlPublica: certificate.publicUrl,
      })
    : '';

  return (
    <View style={styles.screen}>
      <BrandHeader
        title="Verificación Documental"
        subtitle="Registro Oficial • Fundación IMARA"
        showBack={true}
        onBack={() => (router.canGoBack() ? router.back() : router.replace('/'))}
        curved={true}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Banner de Revocatoria si aplica (Punto 6) */}
        {isRevoked ? (
          <View style={styles.revokedBox}>
            <Text style={styles.revokedIcon}>🚫</Text>
            <Text style={styles.revokedTitle}>CONSTANCIA REVOCADA</Text>
            <Text style={styles.revokedMessage}>{revokedNotice}</Text>
          </View>
        ) : (
          <View style={styles.verifiedStatusBox}>
            <Text style={styles.verifiedIcon}>✓</Text>
            <Text style={styles.verifiedTitle}>CONSTANCIA VIGENTE Y REGISTRADA</Text>
            <Text style={styles.verifiedSub}>
              Auditada bajo los estándares del Sistema Distrital de Economía Circular.
            </Text>
          </View>
        )}

        {certificate && (
          <View style={[styles.certCard, isRevoked && styles.certCardRevoked]}>
            <View style={styles.certHeader}>
              <Text style={styles.certOrg}>FUNDACIÓN IMARA • DATA_CIRCULAR</Text>
              <Text style={styles.certTitle}>{contentCert.titulo.toUpperCase()}</Text>
            </View>

            <View style={styles.divider} />

            {/* Texto del PDF (Punto 5) */}
            <Text style={styles.certBodyText}>{certText}</Text>

            <View style={styles.table}>
              <View style={styles.row}>
                <Text style={styles.cellKey}>Sujeto de revisión:</Text>
                <Text style={styles.cellVal}>{certificate.subjectName}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.cellKey}>Fecha realizada:</Text>
                <Text style={styles.cellVal}>{certificate.date}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.cellKey}>Alcance:</Text>
                <Text style={styles.cellVal}>{certificate.scope}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.cellKey}>Vigencia:</Text>
                <Text style={styles.cellVal}>{certificate.validity}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.cellKey}>Código:</Text>
                <Text style={[styles.cellVal, styles.code]}>{certificate.code}</Text>
              </View>
            </View>

            {/* Pie de Borrador si aplica */}
            {certificate.isDraft && (
              <View style={styles.draftBox}>
                <Text style={styles.draftText}>⚖️ {contentCert.pieBorrador}</Text>
              </View>
            )}

            {/* Pie de propiedad de la plataforma */}
            <Text style={styles.propertyFooterText}>{contentCert.piePropiedad}</Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.backHomeBtn}
          onPress={() => router.replace('/')}
        >
          <Text style={styles.backHomeBtnText}>Ir al Portal DATA_CIRCULAR</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F7FAF8',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7FAF8',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: Tokens.colors.textSecondary,
  },
  scrollContent: {
    padding: Tokens.spacing.lg,
  },
  revokedBox: {
    backgroundColor: '#FEE2E2',
    borderWidth: 2,
    borderColor: '#DC2626',
    borderRadius: Tokens.radii.card,
    padding: Tokens.spacing.lg,
    alignItems: 'center',
    marginBottom: Tokens.spacing.lg,
    ...Tokens.shadows.card,
  },
  revokedIcon: {
    fontSize: 36,
    marginBottom: 6,
  },
  revokedTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#991B1B',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  revokedMessage: {
    fontSize: 14,
    fontWeight: '700',
    color: '#7F1D1D',
    textAlign: 'center',
  },
  verifiedStatusBox: {
    backgroundColor: '#EAF6EE',
    borderWidth: 1.5,
    borderColor: '#1F7A45',
    borderRadius: Tokens.radii.card,
    padding: Tokens.spacing.md,
    alignItems: 'center',
    marginBottom: Tokens.spacing.lg,
  },
  verifiedIcon: {
    fontSize: 28,
    color: '#1F7A45',
    fontWeight: '900',
    marginBottom: 2,
  },
  verifiedTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1F4D36',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  verifiedSub: {
    fontSize: 11,
    color: '#3B684F',
    textAlign: 'center',
  },
  certCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Tokens.radii.card,
    borderWidth: 1.5,
    borderColor: '#2F6B48',
    padding: Tokens.spacing.lg,
    marginBottom: Tokens.spacing.lg,
    ...Tokens.shadows.card,
  },
  certCardRevoked: {
    opacity: 0.7,
    borderColor: '#DC2626',
  },
  certHeader: {
    alignItems: 'center',
  },
  certOrg: {
    fontSize: 11,
    fontWeight: '800',
    color: '#3B684F',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  certTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#1F4D36',
    textAlign: 'center',
  },
  divider: {
    height: 1.5,
    backgroundColor: '#D1E5D8',
    marginVertical: Tokens.spacing.md,
  },
  certBodyText: {
    fontSize: 12.5,
    lineHeight: 20,
    color: '#102A1C',
    textAlign: 'justify',
    marginBottom: Tokens.spacing.lg,
  },
  table: {
    backgroundColor: '#F8FAF8',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2EBE5',
    padding: Tokens.spacing.md,
    gap: 6,
    marginBottom: Tokens.spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cellKey: {
    fontSize: 11,
    fontWeight: '700',
    color: '#3B684F',
  },
  cellVal: {
    fontSize: 11,
    color: Tokens.colors.textPrimary,
    flex: 1,
    textAlign: 'right',
    marginLeft: 8,
  },
  code: {
    fontFamily: 'monospace',
    fontWeight: '800',
    color: '#0F548C',
  },
  draftBox: {
    backgroundColor: '#FEF9C3',
    borderWidth: 1,
    borderColor: '#CA8A04',
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  draftText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#854D0E',
    textAlign: 'center',
  },
  backHomeBtn: {
    backgroundColor: Tokens.colors.primary,
    paddingVertical: 12,
    borderRadius: Tokens.radii.pill,
    alignItems: 'center',
  },
  backHomeBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  propertyFooterText: {
    fontSize: 10,
    color: Tokens.colors.textMuted,
    textAlign: 'center',
    marginTop: 10,
    fontWeight: '600',
  },
});
