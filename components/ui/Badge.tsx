import { Category } from '@/lib/types';
import { CATEGORY_COLORS, CATEGORY_ICONS } from '@/lib/utils';

interface BadgeProps {
  category: Category;
  showIcon?: boolean;
}

export function CategoryBadge({ category, showIcon = true }: BadgeProps) {
  const color = CATEGORY_COLORS[category];
  const icon = CATEGORY_ICONS[category];

  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
      style={{
        backgroundColor: `${color}18`,
        color: color,
      }}
    >
      {showIcon && <span>{icon}</span>}
      {category}
    </span>
  );
}
