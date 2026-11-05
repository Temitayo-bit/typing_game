export function Stars({ n }: { n: number }) {
  return (
    <span className="tracking-[1px] text-[#C98A1B]" role="img" aria-label={`${n} of 3 stars`}>
      {'★'.repeat(n)}
      <span className="text-line">{'★'.repeat(3 - n)}</span>
    </span>
  );
}
