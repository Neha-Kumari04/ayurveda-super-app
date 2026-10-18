export type VoiceRecognitionState = 'idle' | 'listening' | 'processing' | 'error';

export interface VoiceRecognitionResult {
  text: string;
  confidence: number;
}

export interface VoiceStartOptions {
  /** Called with partial (interim) transcript while the user is still speaking. */
  onPartial?: (text: string) => void;
  /** BCP-47 locale, e.g. 'en-US' or 'hi-IN'. Defaults to 'en-US'. */
  locale?: string;
}

export interface VoiceRecognizer {
  /** Begin listening; resolves with the final recognised text. */
  start(options?: VoiceStartOptions): Promise<VoiceRecognitionResult>;
  /** Cancel an in-flight session. */
  cancel(): void;
  /** True when the platform can recognise speech. */
  isAvailable(): Promise<boolean>;
  /** Request mic + speech permissions. Returns true when granted. */
  requestPermissions(): Promise<boolean>;
}
