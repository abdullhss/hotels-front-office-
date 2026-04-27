import React from 'react'
import { useTranslation } from 'react-i18next'
import { MoreVertical } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu.jsx'
import { cn } from '../../lib/utils'

export default function ActionsDropdown({ actions = [], item, index }) {
  const { i18n } = useTranslation()
  const isArabic = i18n.language === 'ar'
  const [open, setOpen] = React.useState(false)
  const visibleActions = actions.filter((action) => {
    if (action.show === undefined || action.show === null) return true
    if (typeof action.show === 'function') {
      return action.show(item)
    }
    return action.show
  })

  if (visibleActions.length === 0) {
    return <span className="text-muted-foreground">-</span>
  }

  const handleActionClick = (action, e) => {
    e.preventDefault()
    e.stopPropagation()
    setOpen(false)
    if (action.onClick) {
      if (typeof index !== 'undefined' && index !== null) {
        action.onClick(item, index)
      } else {
        action.onClick(item)
      }
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
          className="text-gray-600 cursor-pointer hover:text-gray-800 transition-colors p-1"
        >
          <MoreVertical className="w-5 h-5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        dir={isArabic ? 'rtl' : 'ltr'}
        className="min-w-[120px] bg-white shadow-xl"
      >
        {visibleActions.map((action, actionIndex) => (
          <DropdownMenuItem
            key={actionIndex}
            onClick={(e) => handleActionClick(action, e)}
            className={cn(
              'cursor-pointer',
              isArabic ? 'text-right' : 'text-left',
              action.variant === 'destructive' && 'text-red-600 focus:text-red-600 focus:bg-red-50'
            )}
          >
            {action.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
