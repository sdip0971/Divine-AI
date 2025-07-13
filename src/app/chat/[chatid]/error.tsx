'use client'

function Error({error}:{error:Error}) {
  return (
    <div className="flex-1 flex flex-col justify-center items-center px-4 md:px-6 overflow-y-auto mb-2  font-extrabold text-red">
      {error.message.normalize().toString()}
    </div>
  );
}

export default Error
