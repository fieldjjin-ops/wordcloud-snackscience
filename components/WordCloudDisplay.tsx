import React, { useRef, useEffect } from 'react';
import type { Word } from '../types';

// Extend the Window interface to include d3-cloud's layout
declare global {
  interface Window {
    d3: any;
  }
}

interface WordCloudDisplayProps {
  words: Word[];
}

export const WordCloudDisplay: React.FC<WordCloudDisplayProps> = ({ words }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!words || words.length === 0 || !svgRef.current) return;

    const svg = window.d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous cloud

    const parent = svg.node().parentNode;
    const width = parent.clientWidth;
    const height = Math.min(width * 0.75, 500); // Responsive height
    
    svg.attr('width', width).attr('height', height);

    const maxFontSize = Math.max(...words.map(w => w.value));
    const minFontSize = Math.min(...words.map(w => w.value));

    const fontSizeScale = window.d3.scaleLinear()
      .domain([minFontSize, maxFontSize])
      .range([12, Math.min(width/8, 80)]); // Responsive font size

    const layout = window.d3.layout.cloud()
      .size([width, height])
      .words(words.map(d => ({ text: d.text, size: fontSizeScale(d.value) })))
      .padding(5)
      .rotate(() => (Math.random() > 0.5 ? 0 : 90))
      .font('sans-serif')
      .fontSize((d: any) => d.size)
      .on('end', draw);

    layout.start();

    function draw(words: any[]) {
      const colorScale = window.d3.scaleOrdinal(window.d3.schemeCategory10);
      
      svg.append('g')
        .attr('transform', `translate(${layout.size()[0] / 2},${layout.size()[1] / 2})`)
        .selectAll('text')
        .data(words)
        .enter().append('text')
        .style('font-size', (d: any) => `${d.size}px`)
        .style('font-family', 'sans-serif')
        .style('fill', (_d: any, i: number) => colorScale(i))
        .attr('text-anchor', 'middle')
        .attr('transform', (d: any) => `translate(${[d.x, d.y]})rotate(${d.rotate})`)
        .text((d: any) => d.text);
    }

  }, [words]);

  return <svg ref={svgRef}></svg>;
};
