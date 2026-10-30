<button
  type="button"
  onClick={handleAutoSearch}
  disabled={searchLoading}
  className="bg-purple-600 text-white px-4 py-2 rounded disabled:opacity-50"
>
  {searchLoading ? "در حال جستجو..." : "🔍 جستجوی خودکار در تکنولایف"}
</button>
