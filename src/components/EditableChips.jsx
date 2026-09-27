import { useState } from 'react'

export default function EditableChips({
  items = [],
  onAdd,
  onRemove,
  addPlaceholder = 'Add…',
  addLabel = 'Add',
  emptyLabel = 'None yet',
}) {
  const [value, setValue] = useState('')

  function handleSubmit(event) {
    event.preventDefault()
    const next = value.trim()
    if (!next) return
    onAdd(next)
    setValue('')
  }

  return (
    <div className="editable-chips">
      {items.length === 0 ? (
        <p className="muted">{emptyLabel}</p>
      ) : (
        <ul className="chips">
          {items.map((item) => (
            <li key={item} className="chip chip--removable">
              {item}
              <button
                type="button"
                className="chip__remove"
                aria-label={`Remove ${item}`}
                onClick={() => onRemove(item)}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <form className="editable-chips__add" onSubmit={handleSubmit}>
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={addPlaceholder}
        />
        <button type="submit" className="btn">
          {addLabel}
        </button>
      </form>
    </div>
  )
}