import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/ThemeProvider';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastOptions {
  message: string;
  type?: ToastType;
  /** ms; 0 keeps the toast until dismissed. */
  duration?: number;
  action?: { label: string; onPress: () => void };
}

interface ToastItem extends Required<Omit<ToastOptions, 'action'>> {
  id: number;
  action?: ToastOptions['action'];
}

interface ToastContextValue {
  show: (options: ToastOptions) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
  hide: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION = 3000;
let nextId = 1;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const hide = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback((options: ToastOptions) => {
    const id = nextId++;
    const item: ToastItem = {
      id,
      message: options.message,
      type: options.type ?? 'info',
      duration: options.duration ?? DEFAULT_DURATION,
      action: options.action,
    };
    setToasts((current) => [...current.slice(-2), item]); // at most 3 visible

    // Announce to screen readers — essential for accessibility.
    AccessibilityInfo.announceForAccessibility(options.message);

    if (item.duration > 0) {
      setTimeout(() => hide(id), item.duration);
    }
  }, [hide]);

  const value = useMemo<ToastContextValue>(
    () => ({
      show,
      hide,
      success: (message) => show({ message, type: 'success' }),
      error: (message) => show({ message, type: 'error', duration: 4500 }),
      info: (message) => show({ message, type: 'info' }),
      warning: (message) => show({ message, type: 'warning', duration: 4000 }),
    }),
    [show, hide],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onHide={hide} />
    </ToastContext.Provider>
  );
}

function ToastViewport({ toasts, onHide }: { toasts: ToastItem[]; onHide: (id: number) => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View pointerEvents="box-none" style={[styles.viewport, { top: insets.top + 8 }]}>
      {toasts.map((toast) => (
        <ToastRow key={toast.id} toast={toast} onHide={onHide} />
      ))}
    </View>
  );
}

function ToastRow({ toast, onHide }: { toast: ToastItem; onHide: (id: number) => void }) {
  const theme = useTheme();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-12)).current;
  const [mounted, setMounted] = useState(true);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, friction: 8 }),
    ]).start();
  }, [opacity, translateY]);

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: -12, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      setMounted(false);
      onHide(toast.id);
    });
  };

  if (!mounted) return null;

  const tone =
    toast.type === 'success'
      ? { bg: theme.colors.successMuted, fg: theme.colors.success }
      : toast.type === 'error'
        ? { bg: theme.colors.dangerMuted, fg: theme.colors.danger }
        : toast.type === 'warning'
          ? { bg: theme.colors.warningMuted, fg: theme.colors.warning }
          : { bg: theme.colors.infoMuted, fg: theme.colors.info };

  const icon = toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : toast.type === 'warning' ? '!' : 'i';

  return (
    <Animated.View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={[
        styles.toast,
        { backgroundColor: tone.bg, borderColor: tone.fg, opacity, transform: [{ translateY }] },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: tone.fg }]}>
        <Text style={styles.iconText}>{icon}</Text>
      </View>
      <Text style={[styles.message, { color: theme.colors.text }]} numberOfLines={3}>
        {toast.message}
      </Text>
      {toast.action ? (
        <Pressable
          onPress={() => {
            toast.action?.onPress();
            dismiss();
          }}
          hitSlop={8}
          accessibilityRole="button"
        >
          <Text style={[styles.action, { color: tone.fg }]}>{toast.action.label}</Text>
        </Pressable>
      ) : null}
      <Pressable onPress={dismiss} hitSlop={8} accessibilityRole="button" accessibilityLabel="Dismiss notification">
        <Text style={[styles.close, { color: theme.colors.textMuted }]}>✕</Text>
      </Pressable>
    </Animated.View>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}

const styles = StyleSheet.create({
  viewport: {
    position: 'absolute',
    left: 12,
    right: 12,
    gap: 8,
    zIndex: 1000,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 10,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  iconWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  message: { flex: 1, fontSize: 14, lineHeight: 19 },
  action: { fontSize: 14, fontWeight: '700', textTransform: 'uppercase' },
  close: { fontSize: 14, padding: 2 },
});
