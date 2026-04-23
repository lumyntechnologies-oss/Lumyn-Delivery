export default function Offline() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-primary mb-4">You're Offline</h1>
        <p className="text-secondary">
          Please check your internet connection and try again.
        </p>
      </div>
    </div>
  )
}
