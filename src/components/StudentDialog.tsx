import { useState, useEffect } from "react";
import Modal from "./Modal";
import { useT } from "../i18n/useT";
import { CURRENCY_SYMBOLS, type Student, type AppSettings } from "../data/types";

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
  }) => void;
};

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
  const [useCustomPrice, setUseCustomPrice] = useState(false);
  const [customPrice, setCustomPrice] = useState("");
  const [prepaidBalance, setPrepaidBalance] = useState("0");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (student) {
      setName(student.name);
      setUseCustomPrice(student.customPrice !== null);
      setCustomPrice(student.customPrice !== null ? String(student.customPrice) : "");
      setPrepaidBalance(String(student.prepaidBalance));
      setPhone(student.phone ?? "");
    } else {
      setName("");
      setUseCustomPrice(false);
      setCustomPrice("");
      setPrepaidBalance("0");
      setPhone("");
    }
    setError(null);
  }, [open, student]);

  function handleSubmit() {
    const trimmedName = name.trim();
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

    const balanceVal = Number(prepaidBalance);
    if (!Number.isFinite(balanceVal)) {
      setError(t("studentDialog.error.balance"));
      return;
    }

    onSubmit({
      name: trimmedName,
      customPrice: priceVal,
      prepaidBalance: balanceVal,
      phone: phone.trim() || null,
    });
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
            onChange={(e) => setName(e.target.value)}
            placeholder={t("studentDialog.field.namePlaceholder")}
            autoFocus
          />
        </label>

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
                type="number"
                min={0}
                value={customPrice}
                onChange={(e) => setCustomPrice(e.target.value)}
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

        <label className="field">
          <span className="field-label">
            {t("studentDialog.field.balance")}
          </span>
          <div className="row">
            <input
              className="input"
              type="number"
              value={prepaidBalance}
              onChange={(e) => setPrepaidBalance(e.target.value)}
              placeholder="0"
            />
            <span className="muted-inline">{currencySymbol}</span>
          </div>
          <p className="muted">{t("studentDialog.balanceNote")}</p>
        </label>

        <label className="field">
          <span className="field-label">{t("studentDialog.field.phone")}</span>
          <input
            className="input"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={t("studentDialog.field.phonePlaceholder")}
          />
        </label>

        {error && <div className="form-error">{error}</div>}
      </div>
    </Modal>
  );
}
