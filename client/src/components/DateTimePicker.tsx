/**
 * DatePicker — 日付のみ選択（生年月日等に使用）
 * DateTimePicker — 日付＋30分単位時間プルダウン（デフォルト10:00）
 *
 * 使い方:
 *   <DatePicker value={dateStr} onChange={(v) => setDateStr(v)} />
 *   // value/onChange は "YYYY-MM-DD" 文字列
 *
 *   <DateTimePicker value={date} onChange={(d) => setDate(d)} />
 *   // value/onChange は Date オブジェクト（undefined 可）
 */

import * as React from "react";
import { format, parse, isValid } from "date-fns";
import { ja } from "date-fns/locale";
import { CalendarIcon, Clock } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ─── 30分単位の時間オプション生成 ────────────────────────────────────────────
const TIME_OPTIONS: { label: string; value: string }[] = [];
for (let h = 0; h < 24; h++) {
  for (const m of [0, 30]) {
    const hh = String(h).padStart(2, "0");
    const mm = String(m).padStart(2, "0");
    TIME_OPTIONS.push({ label: `${hh}:${mm}`, value: `${hh}:${mm}` });
  }
}
const DEFAULT_TIME = "10:00";

// ─── DatePicker（日付のみ） ───────────────────────────────────────────────────
interface DatePickerProps {
  /** "YYYY-MM-DD" 形式の文字列 */
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /** 選択可能な最大日付 */
  toDate?: Date;
  /** 選択可能な最小日付 */
  fromDate?: Date;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "日付を選択",
  disabled = false,
  className,
  toDate,
  fromDate,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  // "YYYY-MM-DD" → Date
  const selected = React.useMemo(() => {
    if (!value) return undefined;
    const d = parse(value, "yyyy-MM-dd", new Date());
    return isValid(d) ? d : undefined;
  }, [value]);

  const handleSelect = (day: Date | undefined) => {
    if (day) {
      onChange(format(day, "yyyy-MM-dd"));
    } else {
      onChange("");
    }
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
          {selected ? format(selected, "yyyy年M月d日", { locale: ja }) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={handleSelect}
          defaultMonth={selected}
          toDate={toDate}
          fromDate={fromDate}
          locale={ja}
          captionLayout="dropdown"
        />
      </PopoverContent>
    </Popover>
  );
}

// ─── DateTimePicker（日付＋時間） ─────────────────────────────────────────────
interface DateTimePickerProps {
  /** Date オブジェクト（undefined = 未選択） */
  value: Date | undefined;
  onChange: (value: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /** デフォルト時間（HH:mm 形式、デフォルト "10:00"） */
  defaultTime?: string;
  /** 選択可能な最大日付 */
  toDate?: Date;
  /** 選択可能な最小日付 */
  fromDate?: Date;
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = "日時を選択",
  disabled = false,
  className,
  defaultTime = DEFAULT_TIME,
  toDate,
  fromDate,
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false);

  // 現在の時間文字列（HH:mm）
  const currentTime = React.useMemo(() => {
    if (!value) return defaultTime;
    const hh = String(value.getHours()).padStart(2, "0");
    const mm = value.getMinutes() < 30 ? "00" : "30";
    return `${hh}:${mm}`;
  }, [value, defaultTime]);

  const handleDaySelect = (day: Date | undefined) => {
    if (!day) {
      onChange(undefined);
      return;
    }
    // 時間を引き継ぐ（未選択なら defaultTime を適用）
    const [hh, mm] = (value ? currentTime : defaultTime).split(":").map(Number);
    const newDate = new Date(day);
    newDate.setHours(hh, mm, 0, 0);
    onChange(newDate);
    // 日付選択後も時間選択のためにポップオーバーを開いたまま
  };

  const handleTimeChange = (timeStr: string) => {
    const [hh, mm] = timeStr.split(":").map(Number);
    const base = value ? new Date(value) : new Date();
    base.setHours(hh, mm, 0, 0);
    onChange(base);
    setOpen(false);
  };

  const displayLabel = React.useMemo(() => {
    if (!value) return null;
    return format(value, "yyyy年M月d日 HH:mm", { locale: ja });
  }, [value]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
          {displayLabel ?? placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={handleDaySelect}
          defaultMonth={value}
          toDate={toDate}
          fromDate={fromDate}
          locale={ja}
          captionLayout="dropdown"
        />
        {/* 時間選択（30分単位プルダウン） */}
        <div className="border-t p-3 space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>時間を選択</span>
          </div>
          <Select
            value={currentTime}
            onValueChange={handleTimeChange}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="時間を選択" />
            </SelectTrigger>
            <SelectContent className="max-h-60 overflow-y-auto">
              {TIME_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </PopoverContent>
    </Popover>
  );
}
