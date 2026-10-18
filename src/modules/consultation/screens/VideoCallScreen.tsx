import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useToast } from '@/components/toast/ToastProvider';
import { useTranslation } from '@/i18n';

import type { ConsultStackScreenProps } from '@/navigation/types';

type Props = ConsultStackScreenProps<'VideoCall'>;

type CallState = 'connecting' | 'connected';

import { DoctorPulseBadge } from '@/components/ui/DoctorPulseBadge';
import { PressableScale } from '@/components/ui/PressableScale';

function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Mock 1:1 clinical video consultation. The local front camera is previewed through
 * expo-camera; the remote doctor feed is simulated.
 */
export function VideoCallScreen({ route, navigation }: Props) {
  const { doctorName, specialty } = route.params;
  const { t } = useTranslation();
  const toast = useToast();
  const insets = useSafeAreaInsets();

  const [permission, requestPermission] = useCameraPermissions();
  const [state, setState] = useState<CallState>('connecting');
  const [seconds, setSeconds] = useState(0);
  const [muted, setMuted] = useState(false);
  const [cameraOn, setCameraOn] = useState(true);
  const [cameraFailed, setCameraFailed] = useState(false);

  // Simulate the doctor joining shortly after the screen opens.
  useEffect(() => {
    const id = setTimeout(() => setState('connected'), 1500);
    return () => clearTimeout(id);
  }, []);

  // Elapsed time counter once connected.
  useEffect(() => {
    if (state !== 'connected') return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [state]);

  // Gentle pulse behind the avatar while connecting.
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (state !== 'connecting') return;
    const loop = Animated.loop(
      Animated.timing(pulse, {
        toValue: 1,
        duration: 1200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => {
      loop.stop();
      pulse.setValue(0);
    };
  }, [state, pulse]);

  const onEnd = useCallback(() => {
    toast.info(t('video.ended', { duration: formatDuration(seconds) }));
    navigation.goBack();
  }, [toast, t, seconds, navigation]);

  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.6] });
  const pulseOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0] });

  const statusLabel = useMemo(() => {
    if (state === 'connecting') return t('video.connecting');
    return `${t('video.connected')} · ${formatDuration(seconds)}`;
  }, [state, seconds, t]);

  const showPreview = cameraOn && permission?.granted === true && !cameraFailed;

  return (
    <View style={styles.container}>
      <View style={styles.stage}>
        {state === 'connecting' ? (
          <Animated.View style={[styles.pulse, { opacity: pulseOpacity, transform: [{ scale: pulseScale }] }]} />
        ) : null}
        <View style={styles.avatarWrap}>
          <Ionicons name="medical" size={56} color="#E9F7EF" />
        </View>
        <Text style={styles.doctorName}>{doctorName}</Text>
        <Text style={styles.specialty}>{specialty}</Text>
        <DoctorPulseBadge
          label={statusLabel}
          isOnline={state === 'connected'}
          size="sm"
        />
        {state === 'connecting' ? <Text style={styles.hint}>{t('video.waiting')}</Text> : (
          <View style={styles.encryptionBadge}>
            <Ionicons name="lock-closed" size={11} color="#14B8A6" />
            <Text style={styles.encryptionText}>End-to-End Encrypted Telehealth Session</Text>
          </View>
        )}
      </View>

      <View style={styles.preview}>
        {showPreview ? (
          <CameraView
            style={styles.previewCamera}
            facing="front"
            onMountError={() => setCameraFailed(true)}
          />
        ) : (
          <View style={styles.previewFallback}>
            <Ionicons name={cameraOn ? 'videocam' : 'videocam-off'} size={22} color="#8A94A6" />
          </View>
        )}
      </View>

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <PressableScale
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
          style={styles.headerBtn}
        >
          <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
        </PressableScale>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {t('video.title')}
        </Text>
        <View style={styles.headerBtn} />
      </View>

      {permission && !permission.granted ? (
        <PressableScale
          onPress={() => void requestPermission()}
          accessibilityRole="button"
          style={[styles.permission, { bottom: insets.bottom + 160 }]}
        >
          <Ionicons name="camera" size={16} color="#0B0F14" />
          <Text style={styles.permissionText}>{t('video.grantPermission')}</Text>
        </PressableScale>
      ) : null}

      <View style={[styles.controls, { paddingBottom: insets.bottom + 24 }]}>
        <PressableScale
          onPress={() => setMuted((m) => !m)}
          accessibilityRole="button"
          accessibilityLabel={muted ? t('video.unmute') : t('video.mute')}
          accessibilityState={{ selected: muted }}
          style={[styles.controlBtn, muted && styles.controlBtnActive]}
        >
          <Ionicons name={muted ? 'mic-off' : 'mic'} size={24} color="#FFFFFF" />
        </PressableScale>

        <PressableScale
          onPress={onEnd}
          accessibilityRole="button"
          accessibilityLabel={t('video.endCall')}
          style={styles.endBtn}
        >
          <Ionicons name="call" size={26} color="#FFFFFF" style={styles.endIcon} />
        </PressableScale>

        <PressableScale
          onPress={() => setCameraOn((c) => !c)}
          accessibilityRole="button"
          accessibilityLabel={cameraOn ? t('video.cameraOff') : t('video.cameraOn')}
          accessibilityState={{ selected: !cameraOn }}
          style={[styles.controlBtn, !cameraOn && styles.controlBtnActive]}
        >
          <Ionicons name={cameraOn ? 'videocam' : 'videocam-off'} size={24} color="#FFFFFF" />
        </PressableScale>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0F14' },
  stage: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  pulse: { position: 'absolute', width: 140, height: 140, borderRadius: 70, backgroundColor: '#1F6F5C' },
  avatarWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1F6F5C',
  },
  doctorName: { color: '#FFFFFF', fontSize: 20, fontWeight: '800' },
  specialty: { color: '#8FBFAD', fontSize: 14, fontWeight: '600' },
  status: { color: '#C7D2DB', fontSize: 13, fontWeight: '600', marginTop: 4 },
  hint: { color: '#8A94A6', fontSize: 12.5 },
  encryptionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(20, 184, 166, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(20, 184, 166, 0.3)',
    marginTop: 6,
  },
  encryptionText: {
    color: '#14B8A6',
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
  },
  headerBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, color: '#FFFFFF', fontSize: 16, fontWeight: '700', textAlign: 'center' },
  preview: {
    position: 'absolute',
    top: 96,
    right: 16,
    width: 104,
    height: 140,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#161B22',
    borderWidth: 1,
    borderColor: '#232B36',
  },
  previewCamera: { flex: 1 },
  previewFallback: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  permission: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#E9F7EF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
  },
  permissionText: { color: '#0B0F14', fontWeight: '700', fontSize: 13 },
  controls: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 22,
  },
  controlBtn: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  controlBtnActive: { backgroundColor: 'rgba(255,255,255,0.32)' },
  endBtn: {
    width: 66,
    height: 66,
    borderRadius: 33,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D64545',
  },
  endIcon: { transform: [{ rotate: '135deg' }] },
});
