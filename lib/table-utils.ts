import { astrologyTranslations, zodiacIcons } from './translations';

// Helper function to translate text content
export const translateContent = (content: string, language: 'tr' | 'en') => {
  let translated = content;

  // Replace astrology terms with their translations
  Object.keys(astrologyTranslations[language]).forEach((englishTerm) => {
    const translatedTerm =
      astrologyTranslations[language][
        englishTerm as keyof (typeof astrologyTranslations)[typeof language]
      ];

    // Check if this is a zodiac sign and add icon
    if (zodiacIcons[englishTerm.toLowerCase()]) {
      const icon = zodiacIcons[englishTerm.toLowerCase()];
      const termWithIcon = `${icon} ${translatedTerm}`;

      // Create regex patterns to match whole words (case insensitive)
      const regex = new RegExp(`\\b${englishTerm}\\b`, 'gi');
      translated = translated.replace(regex, termWithIcon);
    } else {
      // Regular translation without icon
      const regex = new RegExp(`\\b${englishTerm}\\b`, 'gi');
      translated = translated.replace(regex, translatedTerm);
    }
  });

  return translated;
};

// Helper function to process Basic Information as simple format
export const processBasicInfoSimple = (
  section: string,
  language: 'tr' | 'en' = 'en'
) => {
  const lines = section
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line);

  // Extract table data and format as table (no heading)
  const tableLines = lines.filter(
    (line) => line.includes('|') && line.split('|').length > 2
  );

  if (tableLines.length > 0) {
    const tableRows = tableLines
      .map((line) =>
        line
          .split('|')
          .map((cell) => cell.trim())
          .filter((cell) => cell)
      )
      .filter((row) => row.length > 0)
      .filter((row) => !row.every((cell) => cell.match(/^-+$/)));

    if (tableRows.length === 0) return '';

    // Determine max column count
    const maxColumns = Math.max(...tableRows.map((row) => row.length));

    let html = '<table class="w-full border-0">';

    // Data rows
    html += '<tbody>';
    tableRows.slice(1).forEach((row) => {
      html += '<tr>';
      // Ensure row has exactly maxColumns cells
      const paddedRow = [...row];
      while (paddedRow.length < maxColumns) {
        paddedRow.push('');
      }

      for (let i = 0; i < maxColumns; i++) {
        const cell = paddedRow[i] || '';
        const cellContent = cell ? translateContent(cell, language) : '';
        html += `<td class="border-0 text-xs text-muted-foreground">${cellContent}</td>`;
      }
      html += '</tr>';
    });
    html += '</tbody></table>';

    return html;
  }

  return '';
};

// Helper function to process regular sections
export const processSection = (
  section: string,
  language: 'tr' | 'en' = 'en'
) => {
  const lines = section
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line);

  if (lines.length === 0) return '';

  // Check if it's a table section
  const tableLines = lines.filter(
    (line) => line.includes('|') && line.split('|').length > 2
  );

  if (tableLines.length > 0) {
    // Process as table
    const header = lines[0].startsWith('#') ? lines[0] : '';
    const tableRows = tableLines
      .map((line) => line.split('|').slice(1, -1))
      .filter((row) => row.length > 0)
      .filter((row) => !row.every((cell) => cell.match(/^-+$/)));

    if (tableRows.length === 0)
      return header
        ? `<h3 class="text-lg font-semibold mt-6 mb-3">${translateContent(header.replace(/^#+\s*/, ''), language)}</h3>`
        : '';

    let html = header
      ? `<h3 class="text-lg font-semibold mt-6 mb-3">${translateContent(header.replace(/^#+\s*/, ''), language)}</h3>`
      : '';
    html +=
      '<div class="overflow-hidden rounded-md border my-4"><table class="w-full border-0">';

    // Determine max column count
    const maxColumns = Math.max(...tableRows.map((row) => row.length));

    // Header row
    const headerRow = tableRows[0];
    const paddedHeaderRow = [...headerRow];
    while (paddedHeaderRow.length < maxColumns) {
      paddedHeaderRow.push('');
    }

    html += '<thead><tr>';
    for (let i = 0; i < maxColumns; i++) {
      const cell = paddedHeaderRow[i] || '';
      const cellContent = cell ? translateContent(cell, language) : '';
      html += `<th class="border px-2 py-1 text-left font-medium text-xs">${cellContent}</th>`;
    }
    html += '</tr></thead>';

    // Data rows
    html += '<tbody>';
    tableRows.slice(1).forEach((row) => {
      html += '<tr>';
      // Ensure row has exactly maxColumns cells
      const paddedRow = [...row];
      while (paddedRow.length < maxColumns) {
        paddedRow.push('');
      }

      for (let i = 0; i < maxColumns; i++) {
        const cell = row[i] || '';
        // Add empty space for middle cells to prevent column shifting
        const cellContent =
          cell || (i > 0 && i < maxColumns - 1 ? '&nbsp;' : '');
        html += `<td class="border px-2 py-1 text-xs">${translateContent(cellContent, language)}</td>`;
      }
      html += '</tr>';
    });
    html += '</tbody></table></div>';

    return html;
  } else {
    // Process as regular text
    return lines
      .map((line) => {
        if (line.startsWith('#')) {
          return `<h3 class="text-lg font-semibold mt-6 mb-3">${translateContent(line.replace(/^#+\s*/, ''), language)}</h3>`;
        } else {
          return `<p class="mb-2">${translateContent(line, language)}</p>`;
        }
      })
      .join('');
  }
};

// Function to convert text tables to HTML with reordering for daily horoscope
export const convertTableToHTML = (
  text: string,
  language: 'tr' | 'en' = 'en'
) => {
  // Split text into sections by headers
  const sections = text.split(/(?=^# )/m).filter((section) => section.trim());

  // Categorize sections
  const transitSections: string[] = [];
  const natalSections: string[] = [];
  let basicInfoSection: string | null = null;

  sections.forEach((section) => {
    const header = section.split('\n')[0].toLowerCase();

    if (
      header.includes('celestial bodies of transit') ||
      header.includes('aspects of transit') ||
      header.includes('aspect cross reference')
    ) {
      transitSections.push(section);
    } else if (header.includes('basic information')) {
      basicInfoSection = section;
    } else {
      natalSections.push(section);
    }
  });

  // Process sections in order: Basic Info → Transit → Natal
  const processedSections: string[] = [];

  // 1. Basic Information first (no heading)
  if (basicInfoSection) {
    processedSections.push(processBasicInfoSimple(basicInfoSection, language));
  }

  // 2. Transit sections
  transitSections.forEach((section) => {
    processedSections.push(processSection(section, language));
  });

  // 3. Natal sections last
  natalSections.forEach((section) => {
    processedSections.push(processSection(section, language));
  });

  return processedSections.join('');
};
