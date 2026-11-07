import { RefreshControl, ScrollView } from "react-native";
import { BiometricGate } from "@/components/care/biometric-gate";
import {
  HomeEmptyState,
  HomeErrorCard,
  SignedInBanner,
} from "@/components/care/home-empty-state";
import { ResultSections } from "@/components/care/result-sections";
import { TabScreen } from "@/components/layout/tab-screen";
import { ScreenHeader } from "@/components/ui/screen-header";
import { ScreenSkeleton } from "@/components/ui/screen-skeleton";
import { useHomeCases } from "@/lib/use-home-cases";

const HomeScreen = () => {
  const {
    patientId,
    patientLabel,
    cases,
    error,
    loading,
    refreshing,
    refresh,
    retry,
  } = useHomeCases();

  const open = cases.filter((item) => item.careCase.status !== "closed");
  const closed = cases.filter((item) => item.careCase.status === "closed");

  return (
    <BiometricGate>
      <TabScreen>
        <ScrollView
          className="flex-1 bg-background"
          contentContainerClassName="gap-5 pb-12"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} />
          }
        >
          <ScreenHeader
            eyebrow="Blood results"
            title="Your care loop"
            subtitle="Screening results, bookings and follow-up in one place."
          />

          {patientId === null ? null : (
            <SignedInBanner patientId={patientId} patientLabel={patientLabel} />
          )}

          {loading ? <ScreenSkeleton rows={3} withHeader={false} /> : null}

          {error === "" ? null : (
            <HomeErrorCard error={error} onRetry={retry} />
          )}

          {loading || error !== "" ? null : cases.length === 0 ? (
            <HomeEmptyState />
          ) : (
            <ResultSections open={open} closed={closed} />
          )}
        </ScrollView>
      </TabScreen>
    </BiometricGate>
  );
};

export default HomeScreen;
