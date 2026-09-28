import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../src/context/AuthContext';
import { Colors } from '../src/theme/colors';
import { Button } from '../src/components/Button';
import { Card } from '../src/components/Card';

export default function WelcomeScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();

  useEffect(() => {
    // Si ya está autenticado, redirigir automáticamente al perfil
    if (!isLoading && isAuthenticated) {
      router.replace('/(app)/profile');
    }
  }, [isLoading, isAuthenticated]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Cargando DATA_CIRCULAR...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Banner Territorial Bogotá */}
        <View style={styles.badgeContainer}>
          <Text style={styles.badgeText}>📍 BOGOTÁ D.C. • COLOMBIA</Text>
        </View>

        {/* Encabezado Principal */}
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoIcon}>♻️</Text>
          </View>
          <Text style={styles.brandTitle}>DATA_CIRCULAR</Text>
          <Text style={styles.brandSubtitle}>
            Plataforma de Economía Circular • Fundación IMARA
          </Text>
        </View>

        {/* Tarjeta de Propósito Territorial */}
        <Card style={styles.purposeCard}>
          <Text style={styles.purposeTitle}>Trazabilidad de Residuos en Bogotá</Text>
          <Text style={styles.purposeDescription}>
            Conectamos generadores, recuperadores ambientales de oficio, transportadores y
            empresas transformadoras en las 20 localidades de Bogotá D.C.
          </Text>

          <View style={styles.featureRow}>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>🏙️</Text>
              <Text style={styles.featureLabel}>20 Localidades</Text>
              <Text style={styles.featureSub}>Cobertura Distrital</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>💵</Text>
              <Text style={styles.featureLabel}>Precios Justos</Text>
              <Text style={styles.featureSub}>Moneda Pesos COP</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>🌱</Text>
              <Text style={styles.featureLabel}>Res. 2184</Text>
              <Text style={styles.featureSub}>MinAmbiente Col.</Text>
            </View>
          </View>
        </Card>

        {/* Resumen de Actores del Ecosistema */}
        <View style={styles.actorsContainer}>
          <View style={styles.actorChip}>
            <Text style={styles.actorChipText}>🏢 Generadores Comerciales</Text>
          </View>
          <View style={styles.actorChip}>
            <Text style={styles.actorChipText}>🤝 Recicladores de Oficio</Text>
          </View>
          <View style={styles.actorChip}>
            <Text style={styles.actorChipText}>🏭 Transformadores Industriales</Text>
          </View>
        </View>

        {/* Acciones de Entrada */}
        <View style={styles.actionsContainer}>
          {isAuthenticated ? (
            <Button
              title={`Continuar como ${user?.fullName || 'Usuario'}`}
              onPress={() => router.push('/(app)/profile')}
              variant="primary"
            />
          ) : (
            <>
              <Button
                title="Iniciar Sesión"
                onPress={() => router.push('/(auth)/login')}
                variant="primary"
              />
              <Button
                title="Crear Nueva Cuenta"
                onPress={() => router.push('/(auth)/register')}
                variant="outline"
              />
            </>
          )}
        </View>

        <Text style={styles.legalFooter}>
          DATA_CIRCULAR v0.1.0 • Práctica Universitaria Fundación IMARA
          {'\n'}Cumplimiento Ley 1581 de 2012 de Protección de Datos Personales
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.textMuted,
  },
  scrollContent: {
    padding: 24,
    alignItems: 'center',
  },
  badgeContainer: {
    backgroundColor: Colors.accentLight,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    marginBottom: 16,
  },
  badgeText: {
    color: Colors.primaryDark,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  logoIcon: {
    fontSize: 36,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.primaryDark,
    letterSpacing: 1,
  },
  brandSubtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
  purposeCard: {
    width: '100%',
    padding: 18,
    marginVertical: 12,
  },
  purposeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 6,
    textAlign: 'center',
  },
  purposeDescription: {
    fontSize: 13,
    color: Colors.text,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  featureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 14,
  },
  featureItem: {
    alignItems: 'center',
    flex: 1,
  },
  featureIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  featureLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
  },
  featureSub: {
    fontSize: 10,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 2,
  },
  actorsContainer: {
    width: '100%',
    marginVertical: 12,
    gap: 6,
  },
  actorChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  actorChipText: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  actionsContainer: {
    width: '100%',
    marginVertical: 16,
  },
  legalFooter: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 16,
  },
});
