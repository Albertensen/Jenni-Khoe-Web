<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: sans-serif; font-size: 12px; color: #333; line-height: 1.6; }
        .header { text-align: center; margin-bottom: 30px; }
        .header h1 { font-size: 20px; color: #B76E79; margin-bottom: 5px; }
        .header p { font-size: 10px; color: #888; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f9f2f0; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; }
        .total-row { font-weight: bold; }
        .footer { margin-top: 40px; text-align: center; font-size: 10px; color: #aaa; }
        .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-30deg); font-size: 80px; opacity: 0.05; color: #B76E79; pointer-events: none; }
    </style>
</head>
<body>
    <div class="watermark">JENNI KHOE MUA</div>
    <div class="header">
        <h1>INVOICE</h1>
        <p>{{ $invoice_number }}</p>
        <p>{{ $date }}</p>
    </div>

    <table>
        <tr><th>Klien</th><td>{{ $client->name }}</td></tr>
        <tr><th>Acara</th><td>{{ $booking->event_date->format('d F Y') }}</td></tr>
        <tr><th>Lokasi</th><td>{{ $booking->venue }}</td></tr>
        <tr><th>Paket</th><td>{{ $booking->service_package }}</td></tr>
    </table>

    <table>
        <tr><th>Item</th><th style="text-align:right">Harga</th></tr>
        <tr><td>Paket Dasar - {{ $booking->service_package }}</td><td style="text-align:right">Rp {{ number_format($booking->total_amount, 0, ',', '.') }}</td></tr>
        @foreach ($addons as $addon)
        <tr><td>{{ $addon['label'] ?? $addon['name'] }}</td><td style="text-align:right">Rp {{ number_format($addon['price'], 0, ',', '.') }}</td></tr>
        @endforeach
        @if ($discount > 0)
        <tr><td>Diskon</td><td style="text-align:right">-Rp {{ number_format($discount, 0, ',', '.') }}</td></tr>
        @endif
        <tr class="total-row"><td>Grand Total</td><td style="text-align:right">Rp {{ number_format($grand_total, 0, ',', '.') }}</td></tr>
        <tr><td>DP 50%</td><td style="text-align:right; color: #B76E79;">Rp {{ number_format($dp, 0, ',', '.') }}</td></tr>
    </table>

    <p style="font-size: 11px; color: #666;"><strong>Ketentuan:</strong> DP 50% wajib dibayarkan untuk konfirmasi booking. Sisa pembayaran lunas H-7 acara.</p>
    <p style="font-size: 11px; color: #666;">Pembatalan H-14: DP hangus 50%. Pembatalan H-7: DP hangus 100%.</p>

    <div class="footer">
        <p>Jenni Khoe MUA — Luxury Wedding & Party Makeup</p>
        <p>www.jennikhoemua.com | IG: @jennikhoemua</p>
    </div>
</body>
</html>
