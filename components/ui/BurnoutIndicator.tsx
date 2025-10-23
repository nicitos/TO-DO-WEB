import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface BurnoutIndicatorProps {
  score: number;
  style?: any;
}

export function BurnoutIndicator({ score, style }: BurnoutIndicatorProps) {
  const getBurnoutColor = (score: number): string => {
    if (score <= 1.5) return '#4CAF50'; // Green - Low
    if (score <= 3.0) return '#FFC107'; // Yellow - Medium
    if (score <= 4.5) return '#FF9800'; // Orange - High
    return '#F44336'; // Red - Critical
  };

  const getBurnoutLabel = (score: number): string => {
    if (score <= 1.5) return 'Relaxed';
    if (score <= 3.0) return 'Balanced';
    if (score <= 4.5) return 'Busy';
    return 'Overloaded';
  };

  const fillWidth = Math.min((score / 5) * 100, 100);

  return (
    <View style={[styles.container, style]}>
      <View style={styles.barContainer}>
        <View style={styles.barBackground}>
          <View 
            style={[
              styles.barFill, 
              { 
                width: `${fillWidth}%`, 
                backgroundColor: getBurnoutColor(score) 
              }
            ]} 
          />
        </View>
      </View>
      <Text style={[styles.label, { color: getBurnoutColor(score) }]}>
        {getBurnoutLabel(score)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginTop: 4,
  },
  barContainer: {
    width: '100%',
    paddingHorizontal: 8,
  },
  barBackground: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
    transition: 'width 0.3s ease',
  },
  label: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
    textAlign: 'center',
  },
});