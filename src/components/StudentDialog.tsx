import { useState, useEffect } from "react";
import Modal from "./Modal";
import { useT } from "../i18n/useT";
import {
  CURRENCY_SYMBOLS,
  type Student,
  type AppSettings,
  type PaymentType,
} from "../data/types";

type Props = {
  open: boolean;
  student: Student | null;
  settings: AppSettings;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    customPrice: number | null;
    prepaidBalance: number;
    phone: string | null;
    paymentType: PaymentType;
  }) => void;
};

// Input limits: keep numbers and phone within sane bounds so the UI can't
// be jammed with millions of digits.
const NAME_MAX = 60;
const PHONE_MAX = 24;
const PRICE_MAX_DIGITS = 7; // up to 9,999,999 per lesson
const BALANCE_MAX_DIGITS = 9; // up to ±999,999,999

export default function StudentDialog({
  open,
  student,
  settings,
  onClose,
  onSubmit,
}: Props) {
  const { t } = useT();
  const isEdit = student !== null;
  const currencySymbol = CURRENCY_SYMBOLS[settings.currency];

  const [name, setName] = useState("");
  const [paymentType, setPaymentType] = useState<PaymentType>("prepaid");
  const [useCustomPrice, setUseCustomPrice] = useState(false);
  const [customPrice, setCustomPrice] = useState("");
  const [prepaidBalance, setPrepaidBalance] = useState("0");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (student) {
      setName(student.name);
      setPaymentType(student.paymentType ?? "prepaid");
      setUseCustomPrice(student.customPrice !== null);
      setCustomPrice(student.customPrice !== null ? String(student.customPrice) : "");
      setPrepaidBalance(String(student.prepaidBalance));
      setPhone(student.phone ?? "");
    } else {
      setName("");
      setPaymentType("prepaid");
      setUseCustomPrice(false);
      setCustomPrice("");
      setPrepaidBalance("0");
      setPhone("");
    }
    setError(null);
  }, [open, student]);

  function handleSubmit() {
    const trimmedName = name.trim().slice(0, NAME_MAX);
    if (!trimmedName) {
      setError(t("studentDialog.error.name"));
      return;
    }

    let priceVal: number | null = null;
    if (useCustomPrice) {
      const v = Number(customPrice);
      if (!Number.isFinite(v) || v < 0) {
        setError(t("studentDialog.error.price"));
        return;
      }
      priceVal = v;
    }

    const balanceVal =
      paymentType === "postpaid" ? 0 : Number(prepaidBalance);
    if (!Number.isFinite(balanceVal)) {
      setError(t("studentDialog.error.balance"));
      return;
    }

    onSubmit({
      name: trimmedName,
      customPrice: priceVal,
      prepaidBalance: balanceVal,
      phone: phone.trim().slice(0, PHONE_MAX) || null,
      paymentType,
    });
  }

  // Controlled-input clampers: only accept strings that fit the limit.
  function onPriceChange(s: string) {
    if (s === "" || new RegExp(`^\\d{0,${PRICE_MAX_DIGITS}}$`).test(s)) {
      setCustomPrice(s);
    }
  }
  function onBalanceChange(s: string) {
    if (
      s === "" ||
      s === "-" ||
      new RegExp(`^-?\\d{0,${BALANCE_MAX_DIGITS}}$`).test(s)
    ) {
      setPrepaidBalance(s);
    }
  }

  return (
    <Modal
      open={open}
      title={t(isEdit ? "studentDialog.titleEdit" : "studentDialog.titleNew")}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>
            {t("common.cancel")}
          </button>
          <button className="btn btn-primary" onClick={handleSubmit}>
            {t(isEdit ? "common.save" : "common.add")}
          </button>
        </>
      }
    >
      <div className="form">
        <label className="field">
          <span className="field-label">{t("studentDialog.field.name")}</span>
          <input
            className="input"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, NAME_MAX))}
            maxLength={NAME_MAX}
            placeholder={t("studentDialog.field.namePlaceholder")}
            autoFocus
          />
        </label>

        <div className="field">
          <span className="field-label">
            {t("studentDialog.field.paymentType")}
          </span>
          <div className="row">
            <button
              type="button"
              className={`btn ${paymentType === "prepaid" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setPaymentType("prepaid")}
            >
              {t("studentDialog.paymentType.prepaid")}
            </button>
            <button
              type="button"
              className={`btn ${paymentType === "postpaid" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setPaymentType("postpaid")}
            >
              {t("studentDialog.paymentType.postpaid")}
            </button>
          </div>
          <p className="muted">
            {paymentType === "prepaid"
              ? t("studentDialog.paymentType.prepaidNote")
              : t("studentDialog.paymentType.postpaidNote")}
          </p>
        </div>

        <div className="field">
          <span className="field-label">{t("studentDialog.field.price")}</span>
          <label className="switch">
            <input
              type="checkbox"
              checked={useCustomPrice}
              onChange={(e) => setUseCustomPrice(e.target.checked)}
            />
            <span>{t("studentDialog.customPriceToggle")}</span>
          </label>
          {useCustomPrice ? (
            <div className="row">
              <input
                className="input"
                type="text"
                inputMode="numeric"
                value={customPrice}
                onChange={(e) => onPriceChange(e.target.value)}
                placeholder={String(settings.defaultPrice)}
              />
              <span className="muted-inline">{currencySymbol}</span>
            </div>
          ) : (
            <p className="muted">
              {t("studentDialog.defaultPriceNote", {
                price: `${settings.defaultPrice} ${currencySymbol}`,
              })}
            </p>
          )}
        </div>

        {paymentType === "prepaid" && (
          <label className="field">
            <span className="field-label">
              {t("studentDialog.field.balance")}
            </span>
            <div className="row">
              <input
                className="input"
                type="text"
                inputMode="numeric"
                value={prepaidBalance}
                onChange={(e) => onBalanceChange(e.target.value)}
                placeholder="0"
              />
              <span className="muted-inline">{currencySymbol}</span>
            </div>
            <p className="muted">{t("studentDialog.balanceNote")}</p>
          </label>
        )}

        <label className="field">
          <span className="field-label">{t("studentDialog.field.phone")}</span>
          <input
            className="input"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value.slice(0, PHONE_MAX))}
            maxLength={PHONE_MAX}
            placeholder={t("studentDialog.field.phonePlaceholder")}
          />
        </label>

        {error && <div className="form-error">{error}</div>}
      </div>
    </Modal>
  );
}
