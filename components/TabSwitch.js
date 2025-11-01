import React, { useRef, useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { COLORS, GLOBAL_STYLES } from '../theme/theme';

const TabSwitch = ({ tabs = [], activeTab, onChange }) => {
  const indicatorAnim = useRef(new Animated.Value(0)).current;
  const [containerWidth, setContainerWidth] = useState(0);

  // Measure container width
  const handleLayout = (e) => {
    const { width } = e.nativeEvent.layout;
    if (width !== containerWidth) setContainerWidth(width);
  };

  const tabWidth = useMemo(() => {
    return containerWidth > 0 ? containerWidth / tabs.length : 0;
  }, [containerWidth, tabs.length]);

  // Animate indicator when activeTab changes
  useEffect(() => {
    if (containerWidth > 0) {
      const activeIndex = tabs.indexOf(activeTab);
      Animated.spring(indicatorAnim, {
        toValue: activeIndex * tabWidth,
        useNativeDriver: true,
        stiffness: 200,
        damping: 25,
        mass: 1,
      }).start();
    }
  }, [activeTab, tabWidth, containerWidth]);

  return (
    <View style={{ paddingHorizontal: 10 }}>
      <View style={styles.container} onLayout={handleLayout}>
        <View style={GLOBAL_STYLES.row}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                onPress={() => onChange(tab)}
                style={[styles.tabButton, { width: tabWidth }]}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    GLOBAL_STYLES.kpiLabel,
                    { color: isActive ? COLORS.white : '#555' },
                  ]}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
          {containerWidth > 0 && (
            <Animated.View
              style={[
                styles.indicator,
                {
                  width: tabWidth,
                  transform: [{ translateX: indicatorAnim }],
                },
              ]}
            />
          )}
        </View>
      </View>
    </View>
  );
};

export default TabSwitch;

const styles = StyleSheet.create({
  container: {
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    width: '100%',
    borderColor: '#ccc',
    marginVertical: 10,
  },
  tabButton: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    zIndex: 1, // keep above indicator
  },
  indicator: {
    position: 'absolute',
    height: '100%',
    backgroundColor: COLORS.primary,
    top: 0,
    left: 0,
    borderRadius: 10,
    zIndex: 0,
  },
});
