import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface BurnoutIndicatorProps {
  score: number;
  style?: any;
}

// Устанавливаем максимальный "вес" дня. Теперь это 20.
const MAX_BURNOUT_SCORE = 20;

export function BurnoutIndicator({ score, style }: BurnoutIndicatorProps) {
  const getBurnoutColor = (currentScore: number): string => {
    const percentage = currentScore / MAX_BURNOUT_SCORE;
    if (percentage <= 0.25) return '#4CAF50'; // Green - до 25%
    if (percentage <= 0.5) return '#FFC107'; // Yellow - до 50%
    if (percentage <= 0.75) return '#FF9800'; // Orange - до 75%
    return '#F44336'; // Red - выше 75%
  };

  const getBurnoutLabel = (currentScore: number): string => {
    const percentage = currentScore / MAX_BURNOUT_SCORE;
    if (percentage <= 0.25) return 'Relaxed';
    if (percentage <= 0.5) return 'Balanced';
    if (percentage <= 0.75) return 'Busy';
    return 'Overloaded';
  };

  // ====================== КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ ЗДЕСЬ ======================
  // Теперь мы делим текущий балл на 20, а не на 5.
  const fillWidth = Math.min((score / MAX_BURNOUT_SCORE) * 100, 100);
  // =======================================================================

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
    // Убрал transition, он может не работать в React Native
  },
  label: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
    textAlign: 'center',
  },
});