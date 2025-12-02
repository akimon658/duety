import { useSignal } from "@preact/signals"
import { CircleCheck, Unlink, X } from "lucide-preact"
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
          class="btn btn-primary mt-2"
          disabled={!url.value || isLoading.value}
          type="submit"
        >
          {isLoading.value ? <span class="loading loading-spinner" /> : "登録"}
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
  const openDeleteModal = () => {
    const dialog = document.getElementById(
      "delete-calendar-modal",
    ) as HTMLDialogElement

    dialog?.showModal()
  }

  return (
    <>
      <div class="alert" role="alert">
        <CircleCheck class="stroke-success" />

        <span>カレンダーのURLが登録されています</span>

        <button
          class="btn btn-error btn-outline btn-sm"
          onClick={openDeleteModal}
          type="button"
        >
          <Unlink class="size-[1.2em]" />
          解除
        </button>
      </div>

      <dialog id="delete-calendar-modal" class="modal">
        <div class="modal-box">
          <form method="dialog">
            <button
              class="absolute btn btn-circle btn-ghost btn-sm right-2 top-2"
              type="submit"
            >
              <X />
            </button>
          </form>

          <h3 class="font-bold text-lg">登録解除</h3>

          <p class="py-4">カレンダーの登録を解除します。よろしいですか？</p>

          <div class="modal-action">
            <form class="flex gap-2" method="dialog">
              <button class="btn btn-outline" type="submit">閉じる</button>

              <button
                class="btn btn-error"
                disabled={isDeleting.value}
                onClick={onDelete}
                type="button"
              >
                {isDeleting.value
                  ? <span class="loading loading-spinner" />
                  : "解除"}
              </button>
            </form>
          </div>
        </div>

        <form class="modal-backdrop" method="dialog">
          <button type="submit">閉じる</button>
        </form>
      </dialog>
    </>
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
