import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export function exportTournamentPDF(tournament, bracket, rankings) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(18);
  doc.text(tournament?.name || 'Torneo', pageWidth / 2, 15, { align: 'center' });
  doc.setFontSize(10);
  doc.text(
    `${tournament?.date || ''} ${tournament?.time || ''} ${tournament?.field || ''}`,
    pageWidth / 2,
    22,
    { align: 'center' }
  );
  doc.setFontSize(12);

  let y = 35;

  if (bracket?.quarters?.length) {
    doc.setFontSize(14);
    doc.text('Quarti di Finale', 14, y);
    y += 8;
    autoTable(doc, {
      startY: y,
      head: [['Partita', 'Squadra 1', 'Squadra 2', 'Risultato', 'Vincitore']],
      body: bracket.quarters.map((m) => [
        m.match_type || '',
        m.team1_name || 'TBD',
        m.team2_name || 'TBD',
        [m.team1_score, m.team2_score].filter(Boolean).join(' - ') || '-',
        m.winner_name || '-',
      ]),
      theme: 'grid',
    });
    y = doc.lastAutoTable.finalY + 10;
  }

  if (bracket?.semifinals?.length) {
    if (y > 250) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(14);
    doc.text('Semifinali', 14, y);
    y += 8;
    autoTable(doc, {
      startY: y,
      head: [['Partita', 'Squadra 1', 'Squadra 2', 'Risultato', 'Vincitore']],
      body: bracket.semifinals.map((m) => [
        m.match_type || '',
        m.team1_name || 'TBD',
        m.team2_name || 'TBD',
        [m.team1_score, m.team2_score].filter(Boolean).join(' - ') || '-',
        m.winner_name || '-',
      ]),
      theme: 'grid',
    });
    y = doc.lastAutoTable.finalY + 10;
  }

  if (bracket?.finals?.length) {
    if (y > 250) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(14);
    doc.text('Finali', 14, y);
    y += 8;
    autoTable(doc, {
      startY: y,
      head: [['Partita', 'Squadra 1', 'Squadra 2', 'Risultato', 'Vincitore']],
      body: bracket.finals.map((m) => [
        m.match_type || '',
        m.team1_name || 'TBD',
        m.team2_name || 'TBD',
        [m.team1_score, m.team2_score].filter(Boolean).join(' - ') || '-',
        m.winner_name || '-',
      ]),
      theme: 'grid',
    });
    y = doc.lastAutoTable.finalY + 15;
  }

  if (rankings?.length) {
    if (y > 230) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(14);
    doc.text('Classifica Finale', 14, y);
    y += 8;
    autoTable(doc, {
      startY: y,
      head: [['Posizione', 'Giocatore', 'Punti']],
      body: rankings.map((r) => [r.position + '°', r.nickname || r.name || '-', r.points ?? 0]),
      theme: 'grid',
    });
  }

  doc.save((tournament?.name || 'torneo').replace(/\s+/g, '-') + '.pdf');
}
