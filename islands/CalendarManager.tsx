import { useSignal } from "@preact/signals";

interface Calendar {
  id: string;
  url: string;
  name: string | null;
}

interface Props {
  initialCalendars: Calendar[];
}

export default function CalendarManager({ initialCalendars }: Props) {
  const calendars = useSignal<Calendar[]>(initialCalendars);
  const newUrl = useSignal("");
  const newName = useSignal("");
  const isLoading = useSignal(false);
  const error = useSignal("");

  const handleAddCalendar = async (e: Event) => {
    e.preventDefault();

    if (!newUrl.value.trim()) {
      error.value = "URLを入力してください";
      return;
    }

    // Basic URL validation
    try {
      new URL(newUrl.value);
    } catch {
      error.value = "有効なURLを入力してください";
      return;
    }

    isLoading.value = true;
    error.value = "";

    try {
      const response = await fetch("/api/calendars", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: newUrl.value,
          name: newName.value || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "カレンダーの追加に失敗しました");
      }

      const newCalendar = await response.json();
      calendars.value = [...calendars.value, newCalendar];
      newUrl.value = "";
      newName.value = "";
    } catch (err) {
      error.value = err instanceof Error ? err.message : "エラーが発生しました";
    } finally {
      isLoading.value = false;
    }
  };

  const handleDeleteCalendar = async (id: string) => {
    if (!confirm("このカレンダーを削除しますか？")) {
      return;
    }

    isLoading.value = true;
    error.value = "";

    try {
      const response = await fetch(`/api/calendars/${id}`, {
        method: "DELETE",
      });

      if (!response.ok && response.status !== 204) {
        throw new Error("カレンダーの削除に失敗しました");
      }

      calendars.value = calendars.value.filter((c) => c.id !== id);
    } catch (err) {
      error.value = err instanceof Error ? err.message : "エラーが発生しました";
    } finally {
      isLoading.value = false;
    }
  };

  return (
    <div>
      {/* Add Calendar Form */}
      <form onSubmit={handleAddCalendar} class="mb-6 space-y-4">
        <div>
          <label
            htmlFor="url"
            class="block text-sm font-medium text-gray-700 mb-1"
          >
            カレンダーURL *
          </label>
          <input
            id="url"
            type="url"
            value={newUrl.value}
            onInput={(
              e,
            ) => (newUrl.value = (e.target as HTMLInputElement).value)}
            placeholder="https://example.com/calendar.ics"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label
            htmlFor="name"
            class="block text-sm font-medium text-gray-700 mb-1"
          >
            表示名（任意）
          </label>
          <input
            id="name"
            type="text"
            value={newName.value}
            onInput={(
              e,
            ) => (newName.value = (e.target as HTMLInputElement).value)}
            placeholder="例: 後期授業課題"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {error.value && <div class="text-red-600 text-sm">{error.value}</div>}

        <button
          type="submit"
          disabled={isLoading.value}
          class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading.value ? "追加中..." : "カレンダーを追加"}
        </button>
      </form>

      {/* Calendar List */}
      <div class="space-y-3">
        <h3 class="text-lg font-medium text-gray-900">登録済みカレンダー</h3>

        {calendars.value.length === 0
          ? (
            <p class="text-gray-500 text-sm">
              登録されているカレンダーはありません
            </p>
          )
          : (
            <ul class="space-y-2">
              {calendars.value.map((calendar) => (
                <li
                  key={calendar.id}
                  class="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                >
                  <div class="flex-1 min-w-0">
                    <p class="font-medium text-gray-900 truncate">
                      {calendar.name || "名称未設定"}
                    </p>
                    <p class="text-sm text-gray-500 truncate">{calendar.url}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteCalendar(calendar.id)}
                    disabled={isLoading.value}
                    class="ml-4 text-red-600 hover:text-red-800 disabled:opacity-50"
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
                </li>
              ))}
            </ul>
          )}
      </div>
    </div>
  );
}
