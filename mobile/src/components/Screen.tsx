import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';

const Screen = ({
  children,
  scroll = true,
  padded = true,
  backgroundColor = '#f5f7fb'
}: {
  children: React.ReactNode;
  scroll?: boolean;
  padded?: boolean;
  backgroundColor?: string;
}) => {
  if (scroll) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor }]}>
        <ScrollView contentContainerStyle={[styles.scrollContent, padded && styles.padded]} showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor }]}>
      <View style={[styles.staticContent, padded && styles.padded]}>{children}</View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1
  },
  scrollContent: {
    flexGrow: 1
  },
  staticContent: {
    flex: 1
  },
  padded: {
    padding: 20
  }
});

export default Screen;
