import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const EmptyState = ({ title, subtitle }: { title: string; subtitle: string }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 24,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5eaf3',
    alignItems: 'center',
    gap: 8
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center'
  },
  subtitle: {
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20
  }
});

export default EmptyState;
