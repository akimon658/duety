import { useSignal } from "@preact/signals"
import { createContext } from "preact"
import { useContext } from "preact/hooks"

interface Calendar {
  id: string
  url: string
}

const CalendarContext = createContext<{
  calendar: Calendar | undefined
  setCalendar: (calendar: Calendar | undefined) => void
}>({
  calendar: undefined,
  setCalendar: () => {},
})

const AddCalendarForm = () => {
  const url = useSignal("")
  const isLoading = useSignal(false)
  const { setCalendar } = useContext(CalendarContext)
  const onSubmit = async (e: Event) => {
    e.preventDefault()

    isLoading.value = true

    const res = await fetch("/api/calendars", {
      body: JSON.stringify({ url: url.value }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    })
    const newCalendar = await res.json()

    setCalendar(newCalendar)

    isLoading.value = false
  }

  return (
    <form onSubmit={onSubmit}>
      <fieldset class="fieldset">
        <legend class="fieldset-legend">カレンダーを登録</legend>

        <label class="label" htmlFor="calendar-url">カレンダーURL</label>

        <input
          class="input w-full"
          id="calendar-url"
          onInput={(e) => {
            url.value = e.currentTarget.value
          }}
          placeholder="https://lms.s.isct.ac.jp/2025/calendar/export_execute.php?userid=xxx&authtoken=xxx&preset_what=all&preset_time=recentupcoming"
          required
          type="url"
        />

        <button
          class={`btn btn-primary mt-2 ${
            isLoading.value ? "loading loading-spinner" : ""
          }`}
          disabled={!url.value || isLoading.value}
          type="submit"
        >
          {!isLoading.value && "登録"}
        </button>
      </fieldset>
    </form>
  )
}

const RegisteredCalendarManager = () => {
  const { calendar, setCalendar } = useContext(CalendarContext)
  const isDeleting = useSignal(false)
  const onDelete = async () => {
    if (!calendar) {
      throw new Error("No calendar to delete")
    }

    isDeleting.value = true

    await fetch(`/api/calendars/${calendar.id}`, {
      method: "DELETE",
    })
    setCalendar(undefined)

    isDeleting.value = false
  }

  return (
    <div>
      <div class="alert" role="alert">
        <div>✅️</div>

        <span class="flex-1">URLが登録されています</span>

        <button
          class={`btn btn-error btn-outline btn-sm ${
            isDeleting.value ? "loading loading-spinner" : ""
          }`}
          disabled={isDeleting.value}
          onClick={onDelete}
          type="button"
        >
          削除
        </button>
      </div>
    </div>
  )
}

interface Props {
  initialCalendar?: Calendar
}

export const CalendarManager = ({ initialCalendar }: Props) => {
  const calendar = useSignal<Calendar | undefined>(initialCalendar)

  return (
    <CalendarContext.Provider
      value={{
        calendar: calendar.value,
        setCalendar: (newCalendar) => {
          calendar.value = newCalendar
        },
      }}
    >
      {calendar.value ? <RegisteredCalendarManager /> : <AddCalendarForm />}
    </CalendarContext.Provider>
  )
}
