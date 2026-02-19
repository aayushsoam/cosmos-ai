import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Maximize, Minimize } from 'lucide-react';

export const PreviewBox = ({ html, css, js }: { html: string; css: string; js: string; searchQuery: string }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    if (iframeRef.current) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(`
          <html>
            <head>
              <style>${css}</style>
            </head>
            <body>
              ${html || '<div id="app"></div>'}
              <script>${js}</script>
            </body>
          </html>
        `);
        doc.close();
      }
    }
  }, [html, css, js]);

  const toggleFullScreen = () => {
    if (isFullScreen) {
      setIsFullScreen(false);
    } else {
      const newWindow = window.open('', '_blank', 'width=800,height=600');
      if (newWindow) {
        newWindow.document.write(`
          <html>
            <head>
              <style>${css}</style>
            </head>
            <body>
              ${html || '<div id="app"></div>'}
              <script>${js}</script>
            </body>
          </html>
        `);
        newWindow.document.close();
      }
    }
  };

  return (
    <div
      className={`relative border border-gray-700 rounded-md overflow-hidden ${isFullScreen ? 'fixed inset-0 z-50 bg-[#0B0D0E]' : ''}`}>
      <div className="bg-gray-800 text-white p-2 text-sm flex justify-between items-center">
        <span>Preview</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleFullScreen}
          className="hover:bg-transparent hover:border hover:border-white h-8 w-8 p-0">
          {isFullScreen ? <Minimize size={16} /> : <Maximize size={16} />}
        </Button>
      </div>
      {!isFullScreen && <iframe ref={iframeRef} className={`w-full border-none h-[300px] bg-white`} title="Preview" />}
    </div>
  );
};
