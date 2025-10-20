export default function Loading() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-4 text-center">
        <div className="h-6 w-2/3 mx-auto bg-muted rounded" />
        <div className="h-9 w-full bg-muted rounded" />
        <div className="h-9 w-full bg-muted rounded" />
      </div>
    </div>
  )
}