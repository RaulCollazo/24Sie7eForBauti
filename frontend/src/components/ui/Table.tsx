export function Table({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className="w-full overflow-auto"><table className={`w-full text-sm ${className || ''}`}>{children}</table></div>
}
export function TableHeader({ children }: { children: React.ReactNode }) {
  return <thead className="bg-bg-secondary">{children}</thead>
}
export function TableBody({ children }: { children: React.ReactNode }) {
  return <tbody>{children}</tbody>
}
export function TableRow({ children }: { children: React.ReactNode }) {
  return <tr className="border-b border-border">{children}</tr>
}
export function TableHead({ children }: { children: React.ReactNode }) {
  return <th className="h-10 px-3 text-left font-medium text-text-muted">{children}</th>
}
export function TableCell({ children }: { children: React.ReactNode }) {
  return <td className="p-3">{children}</td>
}
