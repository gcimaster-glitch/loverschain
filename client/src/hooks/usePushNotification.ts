import { useState, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

// Base64 URL → Uint8Array変換（VAPID公開鍵用）
function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer as ArrayBuffer;
}

export type PushPermission = "default" | "granted" | "denied" | "unsupported";

export function usePushNotification() {
  const [permission, setPermission] = useState<PushPermission>("default");
  const [isLoading, setIsLoading] = useState(false);
  const [swRegistration, setSwRegistration] =
    useState<ServiceWorkerRegistration | null>(null);

  const { data: status, refetch: refetchStatus } =
    trpc.notification.getStatus.useQuery(undefined, {
      retry: false,
    });

  const { data: vapidData } = trpc.notification.getVapidPublicKey.useQuery(
    undefined,
    { retry: false }
  );

  const subscribeMutation = trpc.notification.subscribe.useMutation();
  const unsubscribeMutation = trpc.notification.unsubscribe.useMutation();

  // Service Worker登録
  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setPermission("unsupported");
      return;
    }

    setPermission(Notification.permission as PushPermission);

    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        setSwRegistration(reg);
        console.log("[Push] Service Worker registered");
      })
      .catch((err) => {
        console.warn("[Push] Service Worker registration failed:", err);
      });
  }, []);

  // 通知許可リクエスト＆購読
  const subscribe = useCallback(async () => {
    if (!swRegistration || !vapidData?.publicKey) {
      toast.error("プッシュ通知の設定が完了していません。");
      return false;
    }

    setIsLoading(true);
    try {
      // 通知許可リクエスト
      const result = await Notification.requestPermission();
      setPermission(result as PushPermission);

      if (result !== "granted") {
        toast.error(
          "通知が許可されませんでした。ブラウザの設定から許可してください。"
        );
        return false;
      }

      // Push購読
      const subscription = await swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidData.publicKey),
      });

      const subJson = subscription.toJSON();
      if (!subJson.endpoint || !subJson.keys?.p256dh || !subJson.keys?.auth) {
        throw new Error("Invalid subscription object");
      }

      await subscribeMutation.mutateAsync({
        endpoint: subJson.endpoint,
        keys: {
          p256dh: subJson.keys.p256dh,
          auth: subJson.keys.auth,
        },
      });

      await refetchStatus();
      toast.success("プッシュ通知を有効にしました。");
      return true;
    } catch (err) {
      console.error("[Push] Subscribe failed:", err);
      toast.error("プッシュ通知の設定に失敗しました。");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [swRegistration, vapidData, subscribeMutation, refetchStatus]);

  // 購読解除
  const unsubscribe = useCallback(async () => {
    if (!swRegistration) return false;

    setIsLoading(true);
    try {
      const subscription =
        await swRegistration.pushManager.getSubscription();
      if (subscription) {
        await unsubscribeMutation.mutateAsync({
          endpoint: subscription.endpoint,
        });
        await subscription.unsubscribe();
      }

      await refetchStatus();
      toast.success("プッシュ通知を無効にしました。");
      return true;
    } catch (err) {
      console.error("[Push] Unsubscribe failed:", err);
      toast.error("プッシュ通知の解除に失敗しました。");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [swRegistration, unsubscribeMutation, refetchStatus]);

  const isSupported =
    "serviceWorker" in navigator && "PushManager" in window && permission !== "unsupported";

  return {
    permission,
    isSupported,
    isSubscribed: status?.isSubscribed ?? false,
    isLoading,
    vapidConfigured: status?.vapidConfigured ?? false,
    subscribe,
    unsubscribe,
  };
}
