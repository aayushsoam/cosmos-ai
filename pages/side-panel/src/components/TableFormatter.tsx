import React from 'react';
import './TableFormatter.css';

interface TableFormatterProps {
  content: string;
}

const TableFormatter: React.FC<TableFormatterProps> = ({ content }) => {
  const parseTable = (tableContent: string) => {
    // Remove separator lines
    const lines = tableContent.split('\n').filter(line => line.trim() && !line.match(/^\|?[\s:|-]+\|?$/));

    if (lines.length === 0) return null;

    const rows = lines.map(line => {
      return line
        .split('|')
        .map(cell => cell.trim())
        .filter(cell => cell.length > 0);
    });

    if (rows.length === 0) return null;

    const headers = rows[0];
    const data = rows.slice(1);

    return { headers, data };
  };

  const tableData = parseTable(content);

  if (!tableData) {
    return <div className="table-error">Invalid table format</div>;
  }

  const handleCopy = async () => {
    const tableText = [tableData.headers.join('\t'), ...tableData.data.map(row => row.join('\t'))].join('\n');

    try {
      await navigator.clipboard.writeText(tableText);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="table-container">
      <div className="table-header-actions">
        <button className="table-copy-btn" onClick={handleCopy} title="Copy table">
          📋 Copy
        </button>
      </div>
      <div className="table-wrapper">
        <table className="formatted-table">
          <thead>
            <tr>
              {tableData.headers.map((header, i) => (
                <th key={i}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableData.data.map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => (
                  <td key={j}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TableFormatter;
