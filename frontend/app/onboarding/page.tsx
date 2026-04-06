"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, getOnboardingStatus, submitOnboarding } from "@/lib/api";
import type { OnboardingInput } from "@/types/models";
import styles from "@/styles/pages/onboarding.module.css";

const OCCUPATIONS: OnboardingInput["occupation"][] = [
  "Student",
  "Salaried",
  "Self-employed",
  "Business owner",
];
const SPENDING_STYLES: OnboardingInput["spendingStyle"][] = [
  "Careful",
  "Balanced",
  "Impulsive",
];
const OVERSPEND_AREAS: OnboardingInput["overspendArea"][] = [
  "Food",
  "Shopping",
  "Entertainment",
  "Transport",
  "Don't know",
];
const CURRENCY_OPTIONS = ["INR", "USD", "EUR", "GBP", "AED", "SGD"];
const STEPS = [
  {
    title: "Personal context",
    eyebrow: "Step 1",
    description: "We start with who you are and how many people depend on your income.",
  },
  {
    title: "Financial base",
    eyebrow: "Step 2",
    description: "Income, commitments, and currency shape every budget and insight later on.",
  },
  {
    title: "Spending behaviour",
    eyebrow: "Step 3",
    description: "This helps FinSage nudge you in the right tone, not a generic one.",
  },
];

const DEFAULT_FORM: OnboardingInput = {
  name: "",
  age: 22,
  occupation: "Student",
  dependents: 0,
  monthlyIncome: 0,
  fixedCommitments: 0,
  currency: "INR",
  spendingStyle: "Balanced",
  hasMonthlyBudget: false,
  monthlyBudget: undefined,
  overspendArea: "Don't know",
};

const parseNumber = (value: string): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export default function OnboardingPage() {
  const router = useRouter();
  const [form, setForm] = useState<OnboardingInput>(DEFAULT_FORM);
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const [me, onboarding] = await Promise.all([getCurrentUser(), getOnboardingStatus()]);
        if (me.onboardingCompleted) {
          router.replace("/dashboard");
          return;
        }

        if (onboarding.profile) {
          setForm({
            name: onboarding.profile.name,
            age: onboarding.profile.age,
            occupation: onboarding.profile.occupation,
            dependents: onboarding.profile.dependents,
            monthlyIncome: onboarding.profile.monthlyIncome,
            fixedCommitments: onboarding.profile.fixedCommitments,
            currency: onboarding.profile.currency,
            spendingStyle: onboarding.profile.spendingStyle,
            hasMonthlyBudget: onboarding.profile.hasMonthlyBudget,
            monthlyBudget: onboarding.profile.monthlyBudget,
            overspendArea: onboarding.profile.overspendArea,
          });
        } else if (me.name) {
          setForm((currentForm) => ({ ...currentForm, name: me.name }));
        }
      } catch {
        router.replace("/login");
      }
    };

    void bootstrap();
  }, [router]);

  const progress = ((step + 1) / STEPS.length) * 100;
  const currentStep = STEPS[step];

  const isStepValid = useMemo(() => {
    if (step === 0) {
      return form.name.trim().length > 1 && form.age >= 13 && form.dependents >= 0;
    }

    if (step === 1) {
      return (
        form.monthlyIncome >= 0 &&
        form.fixedCommitments >= 0 &&
        form.currency.trim().length === 3 &&
        (!form.hasMonthlyBudget || (form.monthlyBudget ?? 0) > 0)
      );
    }

    return Boolean(form.spendingStyle && form.overspendArea);
  }, [form, step]);

  const canSubmit =
    form.name.trim().length > 1 &&
    form.age >= 13 &&
    form.dependents >= 0 &&
    form.monthlyIncome >= 0 &&
    form.fixedCommitments >= 0 &&
    form.currency.trim().length === 3 &&
    (!form.hasMonthlyBudget || (form.monthlyBudget ?? 0) > 0) &&
    Boolean(form.spendingStyle) &&
    Boolean(form.overspendArea);

  const update = <K extends keyof OnboardingInput>(key: K, value: OnboardingInput[K]) =>
    setForm((currentForm) => ({ ...currentForm, [key]: value }));

  const nextStep = () => {
    if (!isStepValid) {
      setError("Please complete the current step before moving on.");
      return;
    }
    setError("");
    setStep((currentStepIndex) => Math.min(currentStepIndex + 1, STEPS.length - 1));
  };

  const previousStep = () => {
    setError("");
    setStep((currentStepIndex) => Math.max(currentStepIndex - 1, 0));
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!canSubmit) {
      setError("Please complete all required onboarding questions.");
      return;
    }

    setSaving(true);
    try {
      await submitOnboarding({
        ...form,
        currency: form.currency.toUpperCase(),
        monthlyBudget: form.hasMonthlyBudget ? form.monthlyBudget : undefined,
      });
      router.push("/dashboard");
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Failed to save onboarding."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className={styles.page}>
      <div className={styles.shell}>
        <aside className={styles.summaryPanel}>
          <span className={styles.badge}>Onboarding</span>
          <h1>Let&apos;s shape FinSage around you.</h1>
          <p>
            These answers get stored in MongoDB and become the base for your dashboard,
            transaction nudges, and the ML insights you&apos;ll add next.
          </p>

          <div className={styles.progressWrap}>
            <div className={styles.progressMeta}>
              <span>{currentStep.eyebrow}</span>
              <strong>{currentStep.title}</strong>
            </div>
            <div className={styles.progressBar}>
              <span style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className={styles.stepList}>
            {STEPS.map((stepItem, index) => (
              <div
                key={stepItem.title}
                className={`${styles.stepItem} ${index === step ? styles.stepItemActive : ""}`}
              >
                <strong>0{index + 1}</strong>
                <span>{stepItem.title}</span>
              </div>
            ))}
          </div>

          <div className={styles.snapshot}>
            <div>
              <span>Name</span>
              <strong>{form.name || "Not added yet"}</strong>
            </div>
            <div>
              <span>Income</span>
              <strong>
                {form.currency} {form.monthlyIncome || 0}
              </strong>
            </div>
            <div>
              <span>Budget</span>
              <strong>
                {form.hasMonthlyBudget
                  ? `${form.currency} ${form.monthlyBudget || 0}`
                  : "No fixed budget"}
              </strong>
            </div>
            <div>
              <span>Overspend area</span>
              <strong>{form.overspendArea}</strong>
            </div>
          </div>
        </aside>

        <form className={styles.formPanel} onSubmit={submit}>
          <div className={styles.formHeader}>
            <span className={styles.kicker}>{currentStep.eyebrow}</span>
            <h2>{currentStep.title}</h2>
            <p>{currentStep.description}</p>
          </div>

          {step === 0 && (
            <div className={styles.questionGrid}>
              <label>
                <span>What&apos;s your name?</span>
                <input value={form.name} onChange={(event) => update("name", event.target.value)} />
              </label>
              <label>
                <span>How old are you?</span>
                <input
                  type="number"
                  min={13}
                  value={form.age}
                  onChange={(event) => update("age", parseNumber(event.target.value))}
                />
              </label>
              <label>
                <span>What do you do?</span>
                <select
                  value={form.occupation}
                  onChange={(event) =>
                    update("occupation", event.target.value as OnboardingInput["occupation"])
                  }
                >
                  {OCCUPATIONS.map((occupation) => (
                    <option key={occupation} value={occupation}>
                      {occupation}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>How many people are financially dependent on you?</span>
                <input
                  type="number"
                  min={0}
                  value={form.dependents}
                  onChange={(event) => update("dependents", parseNumber(event.target.value))}
                />
              </label>
            </div>
          )}

          {step === 1 && (
            <div className={styles.questionGrid}>
              <label>
                <span>What is your monthly take-home income?</span>
                <input
                  type="number"
                  min={0}
                  value={form.monthlyIncome}
                  onChange={(event) => update("monthlyIncome", parseNumber(event.target.value))}
                />
              </label>
              <label>
                <span>Fixed monthly commitments</span>
                <input
                  type="number"
                  min={0}
                  value={form.fixedCommitments}
                  onChange={(event) =>
                    update("fixedCommitments", parseNumber(event.target.value))
                  }
                />
              </label>
              <label>
                <span>Which currency do you use?</span>
                <select value={form.currency} onChange={(event) => update("currency", event.target.value)}>
                  {CURRENCY_OPTIONS.map((currency) => (
                    <option key={currency} value={currency}>
                      {currency}
                    </option>
                  ))}
                </select>
              </label>
              <label className={styles.toggleField}>
                <span>Do you have a monthly budget you try to stick to?</span>
                <div className={styles.toggleRow}>
                  <button
                    type="button"
                    className={`${styles.choiceChip} ${form.hasMonthlyBudget ? styles.choiceChipActive : ""}`}
                    onClick={() => update("hasMonthlyBudget", true)}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    className={`${styles.choiceChip} ${!form.hasMonthlyBudget ? styles.choiceChipActive : ""}`}
                    onClick={() => update("hasMonthlyBudget", false)}
                  >
                    No
                  </button>
                </div>
              </label>
              {form.hasMonthlyBudget && (
                <label className={styles.fullWidth}>
                  <span>If yes, how much?</span>
                  <input
                    type="number"
                    min={0}
                    value={form.monthlyBudget ?? 0}
                    onChange={(event) => update("monthlyBudget", parseNumber(event.target.value))}
                  />
                </label>
              )}
            </div>
          )}

          {step === 2 && (
            <div className={styles.questionGrid}>
              <label>
                <span>How would you describe your spending style?</span>
                <select
                  value={form.spendingStyle}
                  onChange={(event) =>
                    update(
                      "spendingStyle",
                      event.target.value as OnboardingInput["spendingStyle"]
                    )
                  }
                >
                  {SPENDING_STYLES.map((style) => (
                    <option key={style} value={style}>
                      {style}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>What&apos;s the one area you feel you overspend in the most?</span>
                <select
                  value={form.overspendArea}
                  onChange={(event) =>
                    update(
                      "overspendArea",
                      event.target.value as OnboardingInput["overspendArea"]
                    )
                  }
                >
                  {OVERSPEND_AREAS.map((area) => (
                    <option key={area} value={area}>
                      {area}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}

          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.secondary}
              onClick={previousStep}
              disabled={step === 0 || saving}
            >
              Back
            </button>
            {step < STEPS.length - 1 ? (
              <button type="button" className={styles.primary} onClick={nextStep}>
                Continue
              </button>
            ) : (
              <button type="submit" className={styles.primary} disabled={!canSubmit || saving}>
                {saving ? "Saving profile..." : "Continue to dashboard"}
              </button>
            )}
          </div>
        </form>
      </div>
    </section>
  );
}
