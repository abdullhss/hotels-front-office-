const unitToneStyles = {
  available: 'bg-[#dff2e9] text-[#0f766e]',
  occupied: 'bg-[#e4e7ec] text-[#475467]',
  cleaning: 'bg-[#f6e7d2] text-[#b45309]',
  maintenance: 'bg-[#f7dce2] text-[#be123c]',
  'needs-cleaning': 'bg-[#f6efcb] text-[#ca8a04]',
}

function UnitCard({ card }) {
  return (
    <article className={`rounded-2xl p-4 text-center ${unitToneStyles[card.tone]}`}>
      <p className="m-0 text-3xl font-bold leading-none">{card.value}</p>
      <p className="mt-2 text-sm font-medium">{card.label}</p>
    </article>
  )
}

export { unitToneStyles }
export default UnitCard
