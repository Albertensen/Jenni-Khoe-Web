<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: sans-serif; font-size: 12px; color: #333; line-height: 1.6; }
        .spk-number { text-align: right; font-size: 10px; color: #888; margin-bottom: 20px; }
        h1 { text-align: center; font-size: 18px; color: #2C1810; margin-bottom: 5px; }
        .subtitle { text-align: center; font-size: 10px; color: #888; margin-bottom: 30px; }
        h2 { font-size: 14px; color: #B76E79; margin-top: 25px; border-bottom: 1px solid #e0d0c8; padding-bottom: 5px; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { padding: 8px 10px; text-align: left; border-bottom: 1px solid #eee; }
        th { width: 30%; font-weight: normal; color: #888; }
        .terms { margin: 20px 0; padding: 15px; background: #f9f9f9; border-radius: 5px; font-size: 11px; line-height: 1.8; }
        .signature-area { margin-top: 40px; }
        .signature-area img { max-width: 300px; height: auto; border: 1px solid #ddd; padding: 10px; }
        .signature-meta { font-size: 10px; color: #888; margin-top: 10px; }
        .footer { margin-top: 40px; text-align: center; font-size: 10px; color: #aaa; border-top: 1px solid #eee; padding-top: 15px; }
        .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-30deg); font-size: 100px; opacity: 0.03; color: #B76E79; pointer-events: none; }
        .ttd-line { margin-top: 60px; border-top: 1px solid #333; width: 250px; text-align: center; font-size: 11px; padding-top: 5px; }
    </style>
</head>
<body>
    <div class="watermark">JENNI KHOE MUA</div>
    <div class="spk-number">SPK No: {{ $spk_number }}</div>
    <h1>SURAT PERJANJIAN KERJA</h1>
    <p class="subtitle">Layanan Makeup Artist — Jenni Khoe MUA</p>

    <h2>Data Klien</h2>
    <table>
        <tr><th>Nama</th><td>{{ $client->name }}</td></tr>
        <tr><th>Tanggal Acara</th><td>{{ $booking->event_date->format('d F Y') }}</td></tr>
        <tr><th>Venue</th><td>{{ $booking->venue }}</td></tr>
        <tr><th>Paket</th><td>{{ $booking->service_package }}</td></tr>
        <tr><th>Total</th><td>Rp {{ number_format($booking->total_amount, 0, ',', '.') }}</td></tr>
    </table>

    <h2>Pasal-Pasal Perjanjian</h2>
    <div class="terms">
        {!! nl2br(e($contract->terms_content)) !!}
    </div>

    <h2>Tanda Tangan Digital</h2>
    <div class="signature-area">
        <img src="{{ $signature }}" alt="Tanda tangan klien" />
        <div class="signature-meta">
            <p>Tanda tangan digital: {{ $client->name }}</p>
            <p>IP: {{ $contract->signed_ip ?? '—' }}</p>
            <p>Waktu: {{ $contract->signed_at ? $contract->signed_at->format('d F Y H:i:s') : $date }}</p>
        </div>
    </div>

    <div class="footer">
        <p>Jenni Khoe MUA — Luxury Wedding & Party Makeup</p>
        <p>Dokumen resmi ini digenerate secara otomatis dan sah secara hukum.</p>
    </div>
</body>
</html>
