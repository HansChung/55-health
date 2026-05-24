/**
 * OpenAI Realtime WebRTC 客戶端
 * 文件：https://platform.openai.com/docs/guides/realtime-webrtc
 */

interface RealtimeClientCallbacks {
  onConnected?: () => void;
  onUserTranscript?: (text: string) => void;
  onAssistantTranscript?: (text: string, isFinal: boolean) => void;
  onAssistantStartSpeaking?: () => void;
  onAssistantStopSpeaking?: () => void;
  onListening?: (listening: boolean) => void;
  onError?: (error: Error) => void;
  onClose?: () => void;
}

export class RealtimeClient {
  private pc: RTCPeerConnection | null = null;
  private dc: RTCDataChannel | null = null;
  private audioEl: HTMLAudioElement | null = null;
  private localStream: MediaStream | null = null;
  private callbacks: RealtimeClientCallbacks;
  private assistantBuffer = "";
  private model: string;

  constructor(callbacks: RealtimeClientCallbacks = {}, model = "gpt-realtime") {
    this.callbacks = callbacks;
    this.model = model;
  }

  async connect(ephemeralKey: string) {
    try {
      this.pc = new RTCPeerConnection();

      this.audioEl = document.createElement("audio");
      this.audioEl.autoplay = true;
      this.pc.ontrack = (e) => {
        if (this.audioEl) this.audioEl.srcObject = e.streams[0];
        this.callbacks.onAssistantStartSpeaking?.();
      };

      this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.localStream.getTracks().forEach((track) => {
        this.pc!.addTrack(track, this.localStream!);
      });

      this.dc = this.pc.createDataChannel("oai-events");
      this.dc.addEventListener("open", () => {
        this.callbacks.onConnected?.();
      });
      this.dc.addEventListener("message", (e) => this.handleServerEvent(e.data));

      const offer = await this.pc.createOffer();
      await this.pc.setLocalDescription(offer);

      // 試 GA endpoint，失敗就 fallback 到 beta endpoint
      const endpoints = [
        `https://api.openai.com/v1/realtime/calls?model=${this.model}`,
        `https://api.openai.com/v1/realtime?model=${this.model}`,
      ];

      let sdpResp: Response | null = null;
      const errors: string[] = [];

      for (const url of endpoints) {
        const resp = await fetch(url, {
          method: "POST",
          body: offer.sdp,
          headers: {
            Authorization: `Bearer ${ephemeralKey}`,
            "Content-Type": "application/sdp",
          },
        });
        if (resp.ok) {
          sdpResp = resp;
          console.log("[realtime] connected via", url);
          break;
        }
        const errBody = await resp.text();
        errors.push(`${url} → ${resp.status}: ${errBody.substring(0, 150)}`);
        console.error("[realtime] endpoint failed:", url, resp.status, errBody);
      }

      if (!sdpResp) {
        throw new Error("WebRTC handshake 全部失敗：" + errors.join(" | "));
      }

      const answer = { type: "answer" as const, sdp: await sdpResp.text() };
      await this.pc.setRemoteDescription(answer);
    } catch (err) {
      this.callbacks.onError?.(err as Error);
      throw err;
    }
  }

  private handleServerEvent(raw: string) {
    let event: { type: string; [k: string]: unknown };
    try {
      event = JSON.parse(raw);
    } catch {
      return;
    }

    switch (event.type) {
      case "input_audio_buffer.speech_started":
        this.callbacks.onListening?.(true);
        break;
      case "input_audio_buffer.speech_stopped":
        this.callbacks.onListening?.(false);
        break;
      case "conversation.item.input_audio_transcription.completed":
        this.callbacks.onUserTranscript?.((event as { transcript?: string }).transcript ?? "");
        break;
      case "response.audio_transcript.delta":
        this.assistantBuffer += (event as { delta?: string }).delta ?? "";
        this.callbacks.onAssistantTranscript?.(this.assistantBuffer, false);
        break;
      case "response.audio_transcript.done":
        this.callbacks.onAssistantTranscript?.(this.assistantBuffer, true);
        this.assistantBuffer = "";
        break;
      case "response.done":
        this.callbacks.onAssistantStopSpeaking?.();
        break;
      case "error":
        this.callbacks.onError?.(new Error(JSON.stringify((event as { error?: unknown }).error)));
        break;
    }
  }

  close() {
    this.localStream?.getTracks().forEach((t) => t.stop());
    this.dc?.close();
    this.pc?.close();
    this.audioEl?.remove();
    this.callbacks.onClose?.();
  }
}
