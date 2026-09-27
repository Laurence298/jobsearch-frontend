export default function KeywordChips({ keywords, emptyLabel = 'No keywords yet' }) {
  if (!keywords || keywords.length === 0) {
    return <p className="muted">{emptyLabel}</p>
  }

  return (
    <ul className="chips">
      {keywords.map((keyword) => (
        <li key={keyword} className="chip">
          {keyword}
        </li>
      ))}
    </ul>
  )
}
