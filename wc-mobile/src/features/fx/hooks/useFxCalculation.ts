/**
 * FX calculation hook
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Currency } from '../model/types';
import { parseNumberInput } from '@/utils/number';

export type FxField = 'amountFrom' | 'amountTo' | 'rate';

const LOCALE = 'fr-FR';
const RATE_DECIMALS = 6;

const AMOUNT_DECIMALS: Record<Currency, number> = {
  GNF: 0,
  EUR: 2,
  USD: 2,
  TRY: 2,
  XOF: 0,
};

export const parseFxNumber = (value: string): number | null => {
  return parseNumberInput(value);
};

const isPositiveNumber = (value: number | null): value is number =>
  value !== null && value > 0;

const formatInputValue = (value: number, decimals: number) => {
  if (!Number.isFinite(value)) return '';
  const rounded = Number(value.toFixed(decimals));
  return rounded.toString();
};

const formatRateValue = (value: number) =>
  new Intl.NumberFormat(LOCALE, {
    maximumFractionDigits: RATE_DECIMALS,
  }).format(value);

export const useFxCalculation = ({
  fromCurrency,
  toCurrency,
}: {
  fromCurrency: Currency;
  toCurrency: Currency;
}) => {
  const [amountFrom, setAmountFrom] = useState('');
  const [amountTo, setAmountTo] = useState('');
  const [rate, setRate] = useState('');
  const [lastEdited, setLastEdited] = useState<FxField | null>(null);
  const [autoCalculatedField, setAutoCalculatedField] = useState<FxField | null>(null);

  const amountFromDecimals = AMOUNT_DECIMALS[fromCurrency];
  const amountToDecimals = AMOUNT_DECIMALS[toCurrency];

  const numericValues = useMemo(
    () => ({
      amountFrom: parseFxNumber(amountFrom),
      amountTo: parseFxNumber(amountTo),
      rate: parseFxNumber(rate),
    }),
    [amountFrom, amountTo, rate]
  );

  const onChangeAmountFrom = useCallback((value: string) => {
    setLastEdited('amountFrom');
    setAutoCalculatedField(null);
    setAmountFrom(value);
  }, []);

  const onChangeAmountTo = useCallback((value: string) => {
    setLastEdited('amountTo');
    setAutoCalculatedField(null);
    setAmountTo(value);
  }, []);

  const onChangeRate = useCallback((value: string) => {
    setLastEdited('rate');
    setAutoCalculatedField(null);
    setRate(value);
  }, []);

  const formatFieldValue = useCallback(
    (value: number | null | undefined, decimals: number) => {
      if (value === null || value === undefined || !Number.isFinite(value)) return '';
      return formatInputValue(value, decimals);
    },
    []
  );

  const setValues = useCallback(
    (values: { amountFrom?: number | null; amountTo?: number | null; rate?: number | null }) => {
      setLastEdited(null);
      setAutoCalculatedField(null);
      if ('amountFrom' in values) {
        setAmountFrom(formatFieldValue(values.amountFrom ?? null, amountFromDecimals));
      }
      if ('amountTo' in values) {
        setAmountTo(formatFieldValue(values.amountTo ?? null, amountToDecimals));
      }
      if ('rate' in values) {
        setRate(formatFieldValue(values.rate ?? null, RATE_DECIMALS));
      }
    },
    [amountFromDecimals, amountToDecimals, formatFieldValue]
  );

  useEffect(() => {
    if (!lastEdited) return;

    const amountFromValue = numericValues.amountFrom;
    const amountToValue = numericValues.amountTo;
    const rateValue = numericValues.rate;

    let nextAutoField: FxField | null = null;

    if (lastEdited === 'amountFrom') {
      if (isPositiveNumber(amountFromValue) && isPositiveNumber(amountToValue)) {
        const nextRate = amountToValue / amountFromValue;
        const nextRateValue = formatInputValue(nextRate, RATE_DECIMALS);
        nextAutoField = 'rate';
        if (nextRateValue && nextRateValue !== rate) {
          setRate(nextRateValue);
        }
      } else if (isPositiveNumber(amountFromValue) && isPositiveNumber(rateValue)) {
        const nextAmountTo = amountFromValue * rateValue;
        const nextAmountToValue = formatInputValue(nextAmountTo, amountToDecimals);
        nextAutoField = 'amountTo';
        if (nextAmountToValue && nextAmountToValue !== amountTo) {
          setAmountTo(nextAmountToValue);
        }
      }
    } else if (lastEdited === 'amountTo') {
      if (isPositiveNumber(amountFromValue) && isPositiveNumber(amountToValue)) {
        const nextRate = amountToValue / amountFromValue;
        const nextRateValue = formatInputValue(nextRate, RATE_DECIMALS);
        nextAutoField = 'rate';
        if (nextRateValue && nextRateValue !== rate) {
          setRate(nextRateValue);
        }
      } else if (isPositiveNumber(amountToValue) && isPositiveNumber(rateValue)) {
        const nextAmountFrom = amountToValue / rateValue;
        const nextAmountFromValue = formatInputValue(nextAmountFrom, amountFromDecimals);
        nextAutoField = 'amountFrom';
        if (nextAmountFromValue && nextAmountFromValue !== amountFrom) {
          setAmountFrom(nextAmountFromValue);
        }
      }
    } else if (lastEdited === 'rate') {
      if (isPositiveNumber(rateValue) && isPositiveNumber(amountFromValue)) {
        const nextAmountTo = amountFromValue * rateValue;
        const nextAmountToValue = formatInputValue(nextAmountTo, amountToDecimals);
        nextAutoField = 'amountTo';
        if (nextAmountToValue && nextAmountToValue !== amountTo) {
          setAmountTo(nextAmountToValue);
        }
      } else if (isPositiveNumber(rateValue) && isPositiveNumber(amountToValue)) {
        const nextAmountFrom = amountToValue / rateValue;
        const nextAmountFromValue = formatInputValue(nextAmountFrom, amountFromDecimals);
        nextAutoField = 'amountFrom';
        if (nextAmountFromValue && nextAmountFromValue !== amountFrom) {
          setAmountFrom(nextAmountFromValue);
        }
      }
    }

    if (nextAutoField) {
      setAutoCalculatedField(nextAutoField);
    }
  }, [
    amountFrom,
    amountFromDecimals,
    amountTo,
    amountToDecimals,
    lastEdited,
    numericValues.amountFrom,
    numericValues.amountTo,
    numericValues.rate,
    rate,
  ]);

  const ratePreview = useMemo(() => {
    if (!isPositiveNumber(numericValues.rate)) return null;
    return formatRateValue(numericValues.rate);
  }, [numericValues.rate]);

  return {
    amountFrom,
    amountTo,
    rate,
    onChangeAmountFrom,
    onChangeAmountTo,
    onChangeRate,
    setValues,
    numericValues,
    autoCalculatedField,
    ratePreview,
  };
};
