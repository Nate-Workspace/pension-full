import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";

import {
  fetchSettings,
  saveOperationalPreferences,
  savePensionInfo,
  savePricing,
  type BasicConfigForm,
  type PensionInfoForm,
  type RoomPricingForm,
} from "../services/settings-service";

export function useSettingsManagement() {
  const saveMessageTimerRef = useRef<number | null>(null);
  const [pensionInfo, setPensionInfo] = useState<PensionInfoForm>({
    pensionName: "",
    ownerName: "",
    contactPhone: "",
    contactEmail: "",
    address: "",
    city: "",
  });

  const [roomPricing, setRoomPricing] = useState<RoomPricingForm>({
    single: "0",
    double: "0",
    vip: "0",
  });

  const [basicConfig, setBasicConfig] = useState<BasicConfigForm>({
    defaultCheckInTime: "",
    defaultCheckOutTime: "",
    allowWalkInBookings: false,
    autoMarkRoomCleaningAfterCheckout: false,
    requireIdBeforeCheckIn: false,
    sendPaymentReminders: false,
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const savePensionInfoMutation = useMutation({
    mutationFn: savePensionInfo,
    onSuccess: (payload) => {
      setPensionInfo(payload);
      showSaved("Pension information saved.");
    },
    onError: (saveError) => {
      setFormError(saveError instanceof Error ? saveError.message : "Unable to save pension information.");
    },
  });

  const savePricingMutation = useMutation({
    mutationFn: savePricing,
    onSuccess: (payload) => {
      setRoomPricing(payload);
      showSaved("Room pricing settings updated.");
    },
    onError: (saveError) => {
      setFormError(saveError instanceof Error ? saveError.message : "Unable to save room pricing.");
    },
  });

  const saveOperationalPreferencesMutation = useMutation({
    mutationFn: saveOperationalPreferences,
    onSuccess: (payload) => {
      setBasicConfig(payload);
      showSaved("Basic configuration saved.");
    },
    onError: (saveError) => {
      setFormError(saveError instanceof Error ? saveError.message : "Unable to save basic configuration.");
    },
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => fetchSettings(),
  });

  useEffect(() => {
    if (!data) {
      return;
    }

    setPensionInfo(data.pensionInfo);
    setRoomPricing(data.roomPricing);
    setBasicConfig(data.basicConfig);
    setFormError(null);
  }, [data]);

  useEffect(() => {
    if (error) {
      setFormError(error instanceof Error ? error.message : "Unable to load settings.");
    }
  }, [error]);

  const pricingPreview = useMemo(() => {
    return {
      single: Number(roomPricing.single) || 0,
      double: Number(roomPricing.double) || 0,
      vip: Number(roomPricing.vip) || 0,
    };
  }, [roomPricing]);

  const showSaved = (message: string) => {
    setSaveMessage(message);

    if (saveMessageTimerRef.current !== null) {
      window.clearTimeout(saveMessageTimerRef.current);
    }

    saveMessageTimerRef.current = window.setTimeout(() => {
      setSaveMessage(null);
    }, 1800);
  };

  useEffect(() => {
    return () => {
      if (saveMessageTimerRef.current !== null) {
        window.clearTimeout(saveMessageTimerRef.current);
      }
    };
  }, []);

  const handleSavePensionInfo = () => {
    setFormError(null);
    savePensionInfoMutation.mutate(pensionInfo);
  };

  const handleSavePricing = () => {
    const single = Number(roomPricing.single);
    const double = Number(roomPricing.double);
    const vip = Number(roomPricing.vip);

    if (!Number.isFinite(single) || !Number.isFinite(double) || !Number.isFinite(vip)) {
      setFormError("Pricing values must be valid numbers.");
      return;
    }

    if (single < 0 || double < 0 || vip < 0) {
      setFormError("Pricing values must not be negative.");
      return;
    }

    setFormError(null);
    savePricingMutation.mutate({
      single: Math.round(single),
      double: Math.round(double),
      vip: Math.round(vip),
    });
  };

  const handleSaveOperationalPreferences = () => {
    setFormError(null);
    saveOperationalPreferencesMutation.mutate(basicConfig);
  };

  return {
    pensionInfo,
    setPensionInfo,
    roomPricing,
    setRoomPricing,
    basicConfig,
    setBasicConfig,
    pricingPreview,
    isLoading,
    isSavingProfile: savePensionInfoMutation.isPending,
    isSavingPricing: savePricingMutation.isPending,
    isSavingConfig: saveOperationalPreferencesMutation.isPending,
    formError,
    saveMessage,
    handleSavePensionInfo,
    handleSavePricing,
    handleSaveOperationalPreferences,
  };
}
