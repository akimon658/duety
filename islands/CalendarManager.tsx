import { useSignal } from "@preact/signals"

interface Calendar {
  id: string
  url: string
}

interface Props {
  initialCalendar?: Calendar
}

export const CalendarManager = ({ initialCalendar }: Props) => {
  const calendar = useSignal<Calendar | undefined>(initialCalendar)
  const newUrl = useSignal("")
  const isLoading = useSignal(false)
  const error = useSignal("")

  const handleAddCalendar = async (e: Event) => {
    e.preventDefault()

    if (!newUrl.value.trim()) {
      error.value = "URLを入力してください"
      return
    }

    try {
      new URL(newUrl.value)
    } catch {
      error.value = "有効なURLを入力してください"
      return
    }

    isLoading.value = true
    error.value = ""

    try {
      const response = await fetch("/api/calendars", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: newUrl.value,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "カレンダーの追加に失敗しました")
      }

      const newCalendar = await response.json()
      calendar.value = newCalendar
      newUrl.value = ""
    } catch (err) {
      error.value = err instanceof Error ? err.message : "エラーが発生しました"
    } finally {
      isLoading.value = false
    }
  }

  const handleDeleteCalendar = async (id: string) => {
    if (!confirm("このカレンダーを削除しますか？")) {
      return
    }

    isLoading.value = true
    error.value = ""

    try {
      const response = await fetch(`/api/calendars/${id}`, {
        method: "DELETE",
      })

      if (!response.ok && response.status !== 204) {
        throw new Error("カレンダーの削除に失敗しました")
      }

      calendar.value = undefined
    } catch (err) {
      error.value = err instanceof Error ? err.message : "エラーが発生しました"
    } finally {
      isLoading.value = false
    }
  }

  return (
    <div>
      <form onSubmit={handleAddCalendar} class="space-y-4">
        <div class="form-control w-full">
          <label class="label" htmlFor="url">
            <span class="label-text">カレンダーURL *</span>
          </label>
          <input
            id="url"
            type="url"
            value={newUrl.value}
            onInput={(
              e,
            ) => (newUrl.value = (e.target as HTMLInputElement).value)}
            placeholder="https://example.com/calendar.ics"
            class="input input-bordered w-full"
            required
          />
        </div>

        {error.value && (
          <div class="alert alert-error">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="stroke-current shrink-0 h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{error.value}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading.value}
          class={`btn btn-primary w-full ${isLoading.value ? "loading" : ""}`}
        >
          {isLoading.value ? "追加中..." : "カレンダーを追加"}
        </button>
      </form>

      <div class="divider"></div>

      <div>
        <h3 class="text-lg font-semibold mb-3">登録済みカレンダー</h3>

        {!calendar.value
          ? (
            <div class="text-base-content/50 text-sm">
              登録されているカレンダーはありません
            </div>
          )
          : (
            <button
              type="button"
              onClick={() => handleDeleteCalendar(calendar.value.id)}
              disabled={isLoading.value}
              class="btn btn-ghost btn-sm text-error ml-2"
              title="削除"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}
      </div>
    </div>
  )
}
