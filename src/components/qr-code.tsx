'use client';

import QRCode from 'react-qr-code';

export function ReservationQRCode({ value }: { value: string }) {
  return (
    <div className="bg-white p-4 rounded-lg inline-block">
      <QRCode value={value} size={200} />
    </div>
  );
}
