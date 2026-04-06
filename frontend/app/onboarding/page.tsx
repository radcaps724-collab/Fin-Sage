"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

type StepDef = {
  id: string;
  title: string;
  description: string;
  render: (
    form: OnboardingInput,
    update: <K extends keyof OnboardingInput>(key: K, value: OnboardingInput[K]) => void
  ) => React.ReactNode;
  validate: (form: OnboardingInput) => boolean;
};

const parseNumber = (value: string): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const numberInputValue = (value: number | undefined): number | "" =>
  value === 0 || value === undefined ? "" : value;

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

const buildSteps = (
  update: <K extends keyof OnboardingInput>(key: K, value: OnboardingInput[K]) => void
): StepDef[] => [
  {
    id: "name",
    title: "What should we call you?",
    description: "Your name personalizes every dashboard and insight.",
    render: (form) => (
      <label className={styles.fieldBlock}>
        <span>Name</span>
        <input
          value={form.name}
          onChange={(event) => update("name", event.target.value)}
          placeholder="Your full name"
          autoComplete="name"
        />
      </label>
    ),
    validate: (form) => form.name.trim().length > 1,
  },
  {
    id: "age",
    title: "How old are you?",
    description: "We use age context to keep recommendations relevant.",
    render: (form) => (
      <label className={styles.fieldBlock}>
        <span>Age</span>
        <input
          type="number"
          min={13}
          value={numberInputValue(form.age)}
          onChange={(event) => update("age", parseNumber(event.target.value))}
        />
      </label>
    ),
    validate: (form) => form.age >= 13,
  },
  {
    id: "occupation",
    title: "What do you do?",
    description: "Your occupation helps us tune spending and saving nudges.",
    render: (form) => (
      <label className={styles.fieldBlock}>
        <span>Occupation</span>
        <select
          value={form.occupation}
          onChange={(event) => update("occupation", event.target.value as OnboardingInput["occupation"])}
        >
          {OCCUPATIONS.map((occupation) => (
            <option key={occupation} value={occupation}>
              {occupation}
            </option>
          ))}
        </select>
      </label>
    ),
    validate: () => true,
  },
  {
    id: "dependents",
    title: "How many dependents do you support?",
    description: "This improves budgeting accuracy for real-life commitments.",
    render: (form) => (
      <label className={styles.fieldBlock}>
        <span>Dependents</span>
        <input
          type="number"
          min={0}
          value={numberInputValue(form.dependents)}
          onChange={(event) => update("dependents", parseNumber(event.target.value))}
        />
      </label>
    ),
    validate: (form) => form.dependents >= 0,
  },
  {
    id: "income",
    title: "What is your monthly income amount?",
    description: "Income sets the base for all spend insights.",
    render: (form) => (
      <label className={styles.fieldBlock}>
        <span>Monthly income</span>
        <input
          type="number"
          min={0}
          value={numberInputValue(form.monthlyIncome)}
          onChange={(event) => update("monthlyIncome", parseNumber(event.target.value))}
        />
      </label>
    ),
    validate: (form) => form.monthlyIncome >= 0,
  },
  {
    id: "commitments",
    title: "What are your fixed monthly commitments?",
    description: "Rent, EMIs, and bills help us compute your free cashflow.",
    render: (form) => (
      <label className={styles.fieldBlock}>
        <span>Fixed commitments</span>
        <input
          type="number"
          min={0}
          value={numberInputValue(form.fixedCommitments)}
          onChange={(event) => update("fixedCommitments", parseNumber(event.target.value))}
        />
      </label>
    ),
    validate: (form) => form.fixedCommitments >= 0,
  },
  {
    id: "currency",
    title: "What is your preferred currency?",
    description: "All balances and charts will follow this currency.",
    render: (form) => (
      <label className={styles.fieldBlock}>
        <span>Preferred currency</span>
        <select value={form.currency} onChange={(event) => update("currency", event.target.value)}>
          {CURRENCY_OPTIONS.map((currency) => (
            <option key={currency} value={currency}>
              {currency}
            </option>
          ))}
        </select>
      </label>
    ),
    validate: (form) => form.currency.trim().length === 3,
  },
  {
    id: "budget-choice",
    title: "Do you follow a monthly budget?",
    description: "A budget lets FinSage alert you before overspending.",
    render: (form) => (
      <div className={styles.fieldBlock}>
        <span>Monthly budget plan</span>
        <div className={styles.choiceRow}>
          <button
            type="button"
            className={`${styles.choiceBtn} ${form.hasMonthlyBudget ? styles.choiceActive : ""}`}
            onClick={() => update("hasMonthlyBudget", true)}
          >
            Yes
          </button>
          <button
            type="button"
            className={`${styles.choiceBtn} ${!form.hasMonthlyBudget ? styles.choiceActive : ""}`}
            onClick={() => update("hasMonthlyBudget", false)}
          >
            No
          </button>
        </div>
      </div>
    ),
    validate: () => true,
  },
  {
    id: "budget-value",
    title: "What is your monthly budget amount?",
    description: "Set your target so dashboard alerts can guide you.",
    render: (form) => (
      <label className={styles.fieldBlock}>
        <span>Budget amount</span>
        <input
          type="number"
          min={0}
          value={numberInputValue(form.monthlyBudget)}
          onChange={(event) => update("monthlyBudget", parseNumber(event.target.value))}
          disabled={!form.hasMonthlyBudget}
        />
      </label>
    ),
    validate: (form) => !form.hasMonthlyBudget || (form.monthlyBudget ?? 0) > 0,
  },
  {
    id: "style",
    title: "How would you describe your spending style?",
    description: "This helps us tailor recommendations to your behavior.",
    render: (form) => (
      <label className={styles.fieldBlock}>
        <span>Spending style</span>
        <select
          value={form.spendingStyle}
          onChange={(event) => update("spendingStyle", event.target.value as OnboardingInput["spendingStyle"])}
        >
          {SPENDING_STYLES.map((spendingStyle) => (
            <option key={spendingStyle} value={spendingStyle}>
              {spendingStyle}
            </option>
          ))}
        </select>
      </label>
    ),
    validate: (form) => Boolean(form.spendingStyle),
  },
  {
    id: "overspend",
    title: "Where do you overspend the most?",
    description: "We will focus nudges and insights on this area first.",
    render: (form) => (
      <label className={styles.fieldBlock}>
        <span>Overspend area</span>
        <select
          value={form.overspendArea}
          onChange={(event) => update("overspendArea", event.target.value as OnboardingInput["overspendArea"])}
        >
          {OVERSPEND_AREAS.map((overspendArea) => (
            <option key={overspendArea} value={overspendArea}>
              {overspendArea}
            </option>
          ))}
        </select>
      </label>
    ),
    validate: (form) => Boolean(form.overspendArea),
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [form, setForm] = useState<OnboardingInput>(DEFAULT_FORM);
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionClass, setTransitionClass] = useState("");
  const exitTimerRef = useRef<number | null>(null);
  const enterTimerRef = useRef<number | null>(null);

  const update = <K extends keyof OnboardingInput>(key: K, value: OnboardingInput[K]) =>
    setForm((currentForm) => ({ ...currentForm, [key]: value }));

  const steps = useMemo(() => buildSteps(update), []);
  const currentStep = steps[step];
  const progress = ((step + 1) / steps.length) * 100;
  const isLast = step === steps.length - 1;
  const isStepValid = currentStep.validate(form);

  const canSubmit = useMemo(
    () =>
      form.name.trim().length > 1 &&
      form.age >= 13 &&
      form.dependents >= 0 &&
      form.monthlyIncome >= 0 &&
      form.fixedCommitments >= 0 &&
      form.currency.trim().length === 3 &&
      (!form.hasMonthlyBudget || (form.monthlyBudget ?? 0) > 0) &&
      Boolean(form.spendingStyle) &&
      Boolean(form.overspendArea),
    [form]
  );

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

  useEffect(() => {
    return () => {
      if (exitTimerRef.current !== null) {
        window.clearTimeout(exitTimerRef.current);
      }
      if (enterTimerRef.current !== null) {
        window.clearTimeout(enterTimerRef.current);
      }
    };
  }, []);

  const transitionTo = (targetStep: number) => {
    if (isTransitioning || targetStep === step) {
      return;
    }

    const direction = targetStep > step ? "next" : "prev";
    setIsTransitioning(true);
    setTransitionClass(direction === "next" ? styles.slideExitNext : styles.slideExitPrev);

    exitTimerRef.current = window.setTimeout(() => {
      setStep(targetStep);
      setTransitionClass(direction === "next" ? styles.slideEnterNext : styles.slideEnterPrev);

      enterTimerRef.current = window.setTimeout(() => {
        setTransitionClass("");
        setIsTransitioning(false);
      }, 420);
    }, 230);
  };

  const submit = async () => {
    if (!canSubmit) {
      setError("Please complete all required onboarding questions.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await submitOnboarding({
        ...form,
        currency: form.currency.toUpperCase(),
        monthlyBudget: form.hasMonthlyBudget ? form.monthlyBudget : undefined,
      });
      router.push("/dashboard");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to save onboarding.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className={styles.page}>
      <div className={styles.bgGlow} />
      <div className={styles.sliderShell}>
        <div className={styles.topRail}>
          <div className={styles.progressRail}>
            {steps.map((stepItem, index) => (
              <span key={stepItem.id} className={index <= step ? styles.progressActive : ""} />
            ))}
          </div>
          <span className={styles.stepText}>
            {step + 1}/{steps.length}
          </span>
        </div>

        <div className={`${styles.slideViewport} ${transitionClass}`}>
          <h1 className={styles.slideTitle}>{currentStep.title}</h1>
          <p className={styles.slideText}>{currentStep.description}</p>
          <div className={styles.formWrap}>{currentStep.render(form, update)}</div>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.actionsRow}>
          <button
            type="button"
            className={styles.prevBtn}
            onClick={() => transitionTo(Math.max(step - 1, 0))}
            disabled={step === 0 || isTransitioning || saving}
          >
            Prev
          </button>
          {!isLast ? (
            <button
              type="button"
              className={styles.nextBtn}
              onClick={() => {
                if (!isStepValid) {
                  setError("Please answer this question before moving ahead.");
                  return;
                }
                setError("");
                transitionTo(Math.min(step + 1, steps.length - 1));
              }}
              disabled={isTransitioning || saving}
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              className={styles.nextBtn}
              onClick={submit}
              disabled={saving || isTransitioning || !canSubmit}
            >
              {saving ? "Saving..." : "Finish & Go to Dashboard"}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
