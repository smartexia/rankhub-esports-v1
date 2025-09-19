import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Image, Download, Loader2, Trophy, Medal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ExportButtonsProps {
  championshipName: string;
  rankingElementId: string;
  podiumElementId?: string;
}

export function ExportButtons({ 
  championshipName, 
  rankingElementId, 
  podiumElementId 
}: ExportButtonsProps) {
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingPNGComplete, setIsExportingPNGComplete] = useState(false);
  const [isExportingPNGPodium, setIsExportingPNGPodium] = useState(false);
  const { toast } = useToast();

  const sanitizeFileName = (name: string) => {
    return name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  };

  const getCurrentDateTime = () => {
    const now = new Date();
    return now.toISOString().slice(0, 19).replace(/:/g, '-');
  };

  const exportToPDF = async () => {
    try {
      setIsExportingPDF(true);
      
      const element = document.getElementById(rankingElementId);
      if (!element) {
        throw new Error('Elemento de ranking não encontrado');
      }

      // Configurações para melhor qualidade
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: element.scrollWidth,
        height: element.scrollHeight
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Dimensões A4 em mm
      const pdfWidth = 210;
      const pdfHeight = 297;
      const margin = 10;
      const contentWidth = pdfWidth - (margin * 2);
      
      // Calcular altura proporcional
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(contentWidth / (imgWidth * 0.264583), (pdfHeight - margin * 2) / (imgHeight * 0.264583));
      const scaledWidth = imgWidth * 0.264583 * ratio;
      const scaledHeight = imgHeight * 0.264583 * ratio;
      
      // Centralizar horizontalmente
      const xPosition = (pdfWidth - scaledWidth) / 2;
      
      // Adicionar título
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Ranking - ${championshipName}`, pdfWidth / 2, 20, { align: 'center' });
      
      // Adicionar data/hora
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, pdfWidth / 2, 30, { align: 'center' });
      
      // Adicionar imagem
      pdf.addImage(imgData, 'PNG', xPosition, 35, scaledWidth, scaledHeight);
      
      // Salvar arquivo
      const fileName = `ranking_${sanitizeFileName(championshipName)}_${getCurrentDateTime()}.pdf`;
      pdf.save(fileName);
      
      toast({
        title: "PDF Exportado!",
        description: `Arquivo ${fileName} foi baixado com sucesso.`,
      });
      
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      toast({
        title: "Erro na Exportação",
        description: "Não foi possível exportar o PDF. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsExportingPDF(false);
    }
  };

  const exportToPNGComplete = async () => {
    try {
      setIsExportingPNGComplete(true);
      
      const element = document.getElementById(rankingElementId);
      if (!element) {
        throw new Error('Elemento de ranking não encontrado');
      }

      // Buscar dados do ranking diretamente do elemento
      const rankingRows = element.querySelectorAll('[data-ranking-row]');
      const rankingData: Array<{position: number, team: string, points: number}> = [];
      
      rankingRows.forEach((row, index) => {
        const teamName = row.querySelector('[data-team-name]')?.textContent || `Time ${index + 1}`;
        const points = row.querySelector('[data-team-points]')?.textContent || '0';
        rankingData.push({
          position: index + 1,
          team: teamName,
          points: parseInt(points.replace(/\D/g, '')) || 0
        });
      });

      // Se não encontrou dados via data attributes, tentar extrair do DOM
      if (rankingData.length === 0) {
        const tableRows = element.querySelectorAll('tr, .ranking-item, [class*="ranking"]');
        tableRows.forEach((row, index) => {
          if (index === 0) return; // Skip header
          const cells = row.querySelectorAll('td, div, span');
          if (cells.length >= 2) {
            const teamText = Array.from(cells).find(cell => 
              cell.textContent && cell.textContent.length > 3 && !cell.textContent.match(/^\d+$/)
            )?.textContent || `Time ${index}`;
            const pointsText = Array.from(cells).find(cell => 
              cell.textContent && cell.textContent.match(/\d+/)
            )?.textContent || '0';
            
            rankingData.push({
              position: index,
              team: teamText.trim(),
              points: parseInt(pointsText.replace(/\D/g, '')) || 0
            });
          }
        });
      }

      // Criar container temporário para Instagram Stories (1080x1920)
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '0';
      tempContainer.style.width = '1080px';
      tempContainer.style.height = '1920px';
      tempContainer.style.backgroundColor = '#1a1a2e';
      tempContainer.style.padding = '30px 40px';
      tempContainer.style.boxSizing = 'border-box';
      tempContainer.style.display = 'flex';
      tempContainer.style.flexDirection = 'column';
      tempContainer.style.fontFamily = 'Arial, sans-serif';
      tempContainer.style.color = '#ffffff';
      
      // Adicionar título
      const title = document.createElement('h1');
      title.textContent = `🏆 ${championshipName}`;
      title.style.fontSize = '44px';
      title.style.fontWeight = 'bold';
      title.style.textAlign = 'center';
      title.style.color = '#ffffff';
      title.style.marginBottom = '15px';
      title.style.textShadow = '2px 2px 4px rgba(0,0,0,0.8)';
      title.style.lineHeight = '1.2';
      
      // Adicionar subtítulo
      const subtitle = document.createElement('p');
      subtitle.textContent = `Ranking Final • ${new Date().toLocaleDateString('pt-BR')}`;
      subtitle.style.fontSize = '20px';
      subtitle.style.textAlign = 'center';
      subtitle.style.color = '#cccccc';
      subtitle.style.marginBottom = '30px';
      subtitle.style.fontWeight = '300';
      
      // Limitar a 25 times primeiro
      const limitedData = rankingData.slice(0, 25);
      
      // Criar lista de ranking simplificada
      const rankingList = document.createElement('div');
      rankingList.style.flex = '1';
      rankingList.style.display = 'flex';
      rankingList.style.flexDirection = 'column';
      rankingList.style.gap = limitedData.length > 20 ? '6px' : '8px';
      rankingList.style.maxHeight = '1700px';
      rankingList.style.overflow = 'hidden';
      
      // Se temos muitos times, usar layout mais compacto
      const useCompactLayout = limitedData.length > 20;
      
      limitedData.forEach((item, index) => {
        const rankingItem = document.createElement('div');
        rankingItem.style.display = 'flex';
        rankingItem.style.alignItems = 'center';
        rankingItem.style.justifyContent = 'space-between';
        rankingItem.style.padding = useCompactLayout ? '10px 16px' : '12px 20px';
        rankingItem.style.backgroundColor = index < 3 ? 'rgba(255, 215, 0, 0.15)' : 'rgba(255, 255, 255, 0.08)';
        rankingItem.style.borderRadius = '8px';
        rankingItem.style.border = index < 3 ? '2px solid rgba(255, 215, 0, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)';
        rankingItem.style.fontSize = useCompactLayout ? '22px' : '24px';
        rankingItem.style.fontWeight = index < 3 ? 'bold' : '500';
        
        // Posição
        const position = document.createElement('span');
        position.textContent = `${item.position}º`;
        position.style.fontSize = useCompactLayout ? '24px' : '28px';
        position.style.fontWeight = 'bold';
        position.style.color = index < 3 ? '#FFD700' : '#ffffff';
        position.style.minWidth = useCompactLayout ? '60px' : '70px';
        position.style.textAlign = 'center';
        
        // Nome do time
        const teamName = document.createElement('span');
        teamName.textContent = item.team;
        teamName.style.flex = '1';
        teamName.style.marginLeft = useCompactLayout ? '12px' : '16px';
        teamName.style.fontSize = useCompactLayout ? '20px' : '22px';
        teamName.style.color = '#ffffff';
        teamName.style.textOverflow = 'ellipsis';
        teamName.style.overflow = 'hidden';
        teamName.style.whiteSpace = 'nowrap';
        
        // Pontos
        const points = document.createElement('span');
        points.textContent = `${item.points} pts`;
        points.style.fontSize = useCompactLayout ? '20px' : '24px';
        points.style.fontWeight = 'bold';
        points.style.color = index < 3 ? '#FFD700' : '#00ff88';
        points.style.minWidth = useCompactLayout ? '90px' : '110px';
        points.style.textAlign = 'right';
        
        rankingItem.appendChild(position);
        rankingItem.appendChild(teamName);
        rankingItem.appendChild(points);
        rankingList.appendChild(rankingItem);
      });
      
      tempContainer.appendChild(title);
      tempContainer.appendChild(subtitle);
      tempContainer.appendChild(rankingList);
      
      // Adicionar ao DOM temporariamente
      document.body.appendChild(tempContainer);
      
      // Capturar imagem
      const canvas = await html2canvas(tempContainer, {
        width: 1080,
        height: 1920,
        scale: 1,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#1a1a2e'
      });
      
      // Remover elemento temporário
      document.body.removeChild(tempContainer);
      
      // Baixar imagem
      const link = document.createElement('a');
      link.download = `ranking_story_${sanitizeFileName(championshipName)}_${getCurrentDateTime()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      toast({
        title: "PNG Exportado!",
        description: `Imagem simplificada para Instagram Stories foi baixada com sucesso.`,
      });
      
    } catch (error) {
      console.error('Erro ao exportar PNG:', error);
      toast({
        title: "Erro na Exportação",
        description: "Não foi possível exportar a imagem. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsExportingPNGComplete(false);
    }
  };

  const exportToPNGPodium = async () => {
    try {
      setIsExportingPNGPodium(true);
      
      const element = document.getElementById(rankingElementId);
      if (!element) {
        throw new Error('Elemento de ranking não encontrado');
      }

      // Buscar dados do ranking diretamente do elemento
      const rankingRows = element.querySelectorAll('[data-ranking-row]');
      const rankingData: Array<{position: number, team: string, points: number}> = [];
      
      rankingRows.forEach((row, index) => {
        const teamName = row.querySelector('[data-team-name]')?.textContent || `Time ${index + 1}`;
        const points = row.querySelector('[data-team-points]')?.textContent || '0';
        rankingData.push({
          position: index + 1,
          team: teamName,
          points: parseInt(points.replace(/\D/g, '')) || 0
        });
      });

      // Se não encontrou dados via data attributes, tentar extrair do DOM
      if (rankingData.length === 0) {
        const tableRows = element.querySelectorAll('tr, .ranking-item, [class*="ranking"]');
        tableRows.forEach((row, index) => {
          if (index === 0) return; // Skip header
          const cells = row.querySelectorAll('td, div, span');
          if (cells.length >= 2) {
            const teamText = Array.from(cells).find(cell => 
              cell.textContent && cell.textContent.length > 3 && !cell.textContent.match(/^\d+$/)
            )?.textContent || `Time ${index}`;
            const pointsText = Array.from(cells).find(cell => 
              cell.textContent && cell.textContent.match(/\d+/)
            )?.textContent || '0';
            
            rankingData.push({
              position: index,
              team: teamText.trim(),
              points: parseInt(pointsText.replace(/\D/g, '')) || 0
            });
          }
        });
      }

      // Limitar aos 10 melhores
      const top10Data = rankingData.slice(0, 10);
      const podiumData = top10Data.slice(0, 3);
      const nextData = top10Data.slice(3, 10);

      // Criar container temporário para Instagram Stories (1080x1920) - ESTILO FUTURISTA
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '0';
      tempContainer.style.width = '1080px';
      tempContainer.style.height = '1920px';
      tempContainer.style.background = `
        radial-gradient(circle at 20% 80%, rgba(0, 255, 255, 0.15) 0%, transparent 50%),
        radial-gradient(circle at 80% 20%, rgba(255, 0, 255, 0.15) 0%, transparent 50%),
        radial-gradient(circle at 50% 50%, rgba(0, 255, 136, 0.1) 0%, transparent 70%),
        linear-gradient(135deg, #0a0a0f 0%, #1a0a2e 50%, #2a1a4e 100%)
      `;
      tempContainer.style.padding = '10px 20px 20px 20px';
      tempContainer.style.boxSizing = 'border-box';
      tempContainer.style.display = 'flex';
      tempContainer.style.flexDirection = 'column';
      tempContainer.style.fontFamily = 'Orbitron, Exo, Arial, sans-serif';
      tempContainer.style.color = '#ffffff';
      tempContainer.style.overflow = 'hidden';
      
      // Header futurista - 8.5% da altura (160px)
      const header = document.createElement('div');
      header.style.height = '160px';
      header.style.display = 'flex';
      header.style.flexDirection = 'column';
      header.style.justifyContent = 'center';
      header.style.alignItems = 'center';
      header.style.marginBottom = '0px';
      header.style.background = `
        linear-gradient(45deg, rgba(0, 255, 255, 0.1) 0%, rgba(255, 0, 255, 0.1) 100%)
      `;
      header.style.borderRadius = '15px';
      header.style.border = '2px solid rgba(0, 255, 255, 0.3)';
      header.style.boxShadow = `
        0 0 30px rgba(0, 255, 255, 0.2),
        inset 0 0 30px rgba(0, 255, 255, 0.1)
      `;
      
      const title = document.createElement('h1');
      title.textContent = `🏆 ${championshipName}`;
      title.style.fontSize = '36px';
      title.style.fontWeight = 'bold';
      title.style.textAlign = 'center';
      title.style.color = '#00ffff';
      title.style.margin = '0';
      title.style.marginBottom = '8px';
      title.style.textShadow = `
        0 0 10px rgba(0, 255, 255, 0.8),
        0 0 20px rgba(0, 255, 255, 0.5),
        0 0 30px rgba(0, 255, 255, 0.3)
      `;
      title.style.letterSpacing = '2px';
      
      const subtitle = document.createElement('p');
      subtitle.textContent = `TOP 10 RANKING • ${new Date().toLocaleDateString('pt-BR')}`;
      subtitle.style.fontSize = '16px';
      subtitle.style.textAlign = 'center';
      subtitle.style.color = '#ff00ff';
      subtitle.style.margin = '0';
      subtitle.style.textShadow = '0 0 10px rgba(255, 0, 255, 0.6)';
      subtitle.style.letterSpacing = '1px';
      
      header.appendChild(title);
      header.appendChild(subtitle);
      
      // Seção do pódio cyberpunk - 65% da altura (1250px)
      const podiumSection = document.createElement('div');
      podiumSection.style.height = '1250px';
      podiumSection.style.display = 'flex';
      podiumSection.style.justifyContent = 'center';
      podiumSection.style.alignItems = 'flex-end';
      podiumSection.style.gap = '25px';
      podiumSection.style.marginBottom = '5px';
      podiumSection.style.padding = '0px 0';
      podiumSection.style.marginTop = '0px';
      
      // Criar cards do pódio com efeitos neon - ORDEM CORRETA: 2º-1º-3º
      const podiumOrder = [
        { data: podiumData[1], position: 2, index: 1 }, // 2º lugar à esquerda
        { data: podiumData[0], position: 1, index: 0 }, // 1º lugar no centro
        { data: podiumData[2], position: 3, index: 2 }  // 3º lugar à direita
      ];
      
      podiumOrder.forEach((item, displayIndex) => {
        if (!item.data) return; // Skip se não houver dados
        
        const team = item.data;
        const actualIndex = item.index;
        const heights = ['400px', '350px', '300px']; // 1º, 2º, 3º
        const colors = [
          'linear-gradient(135deg, rgba(255, 255, 0, 0.9) 0%, rgba(255, 215, 0, 0.9) 100%)', // 1º - Ouro
          'linear-gradient(135deg, rgba(192, 192, 192, 0.9) 0%, rgba(169, 169, 169, 0.9) 100%)', // 2º - Prata
          'linear-gradient(135deg, rgba(255, 128, 0, 0.9) 0%, rgba(205, 127, 50, 0.9) 100%)' // 3º - Bronze
        ];
        const glowColors = ['#ffff00', '#c0c0c0', '#ff8000']; // 1º, 2º, 3º
        const numbers = ['1', '2', '3']; // 1º, 2º, 3º
        
        const podiumCard = document.createElement('div');
        podiumCard.style.width = '350px';
        podiumCard.style.height = heights[actualIndex];
        podiumCard.style.background = colors[actualIndex];
        podiumCard.style.borderRadius = '20px';
        podiumCard.style.display = 'flex';
        podiumCard.style.flexDirection = 'column';
        podiumCard.style.justifyContent = 'center';
        podiumCard.style.alignItems = 'center';
        podiumCard.style.color = '#000000';
        podiumCard.style.fontWeight = 'bold';
        podiumCard.style.border = `3px solid ${glowColors[actualIndex]}`;
        podiumCard.style.boxShadow = `
          0 0 30px ${glowColors[actualIndex]}80,
          0 0 60px ${glowColors[actualIndex]}40,
          inset 0 0 30px ${glowColors[actualIndex]}20
        `;
        podiumCard.style.position = 'relative';
        podiumCard.style.overflow = 'hidden';
        
        // Efeito de circuito no background
        const circuit = document.createElement('div');
        circuit.style.position = 'absolute';
        circuit.style.top = '0';
        circuit.style.left = '0';
        circuit.style.width = '100%';
        circuit.style.height = '100%';
        circuit.style.background = `
          repeating-linear-gradient(
            45deg,
            transparent,
            transparent 10px,
            ${glowColors[actualIndex]}10 10px,
            ${glowColors[actualIndex]}10 12px
          )
        `;
        circuit.style.opacity = '0.3';
        
        const number = document.createElement('div');
        number.textContent = numbers[actualIndex];
        number.style.fontSize = '75px';
        number.style.fontWeight = 'bold';
        number.style.marginBottom = '20px';
        number.style.textShadow = `0 0 25px ${glowColors[actualIndex]}`;
        number.style.zIndex = '2';
        number.style.position = 'relative';
        
        const teamName = document.createElement('div');
        teamName.textContent = team.team;
        teamName.style.fontSize = '28px';
        teamName.style.fontWeight = 'bold';
        teamName.style.textAlign = 'center';
        teamName.style.marginBottom = '12px';
        teamName.style.zIndex = '2';
        teamName.style.position = 'relative';
        teamName.style.textShadow = '0 0 12px rgba(0,0,0,0.8)';
        
        const points = document.createElement('div');
        points.textContent = `${team.points} pts`;
        points.style.fontSize = '24px';
        points.style.fontWeight = 'bold';
        points.style.zIndex = '2';
        points.style.position = 'relative';
        points.style.textShadow = '0 0 12px rgba(0,0,0,0.8)';
        
        podiumCard.appendChild(circuit);
        podiumCard.appendChild(number);
        podiumCard.appendChild(teamName);
        podiumCard.appendChild(points);
        podiumSection.appendChild(podiumCard);
      });
      
      // Seção próximos colocados cyberpunk - 26.5% da altura (510px)
      const nextSection = document.createElement('div');
      nextSection.style.height = '510px';
      nextSection.style.display = 'flex';
      nextSection.style.flexDirection = 'column';
      
      const nextTitle = document.createElement('h3');
      nextTitle.textContent = 'PRÓXIMOS COLOCADOS';
      nextTitle.style.fontSize = '28px';
      nextTitle.style.fontWeight = 'bold';
      nextTitle.style.textAlign = 'center';
      nextTitle.style.color = '#00ff88';
      nextTitle.style.margin = '0 0 15px 0';
      nextTitle.style.textShadow = `
        0 0 15px rgba(0, 255, 136, 0.8),
        0 0 30px rgba(0, 255, 136, 0.4)
      `;
      nextTitle.style.letterSpacing = '2px';
      
      const nextList = document.createElement('div');
      nextList.style.display = 'flex';
      nextList.style.flexDirection = 'column';
      nextList.style.gap = '8px';
      nextList.style.flex = '1';
      
      nextData.forEach((team, index) => {
        const nextCard = document.createElement('div');
        nextCard.style.display = 'flex';
        nextCard.style.alignItems = 'center';
        nextCard.style.justifyContent = 'space-between';
        nextCard.style.padding = '15px 25px';
        nextCard.style.background = `
          linear-gradient(90deg, 
            rgba(0, 255, 255, 0.1) 0%, 
            rgba(0, 128, 255, 0.1) 50%, 
            rgba(128, 0, 255, 0.1) 100%
          )
        `;
        nextCard.style.borderRadius = '12px';
        nextCard.style.border = '2px solid rgba(0, 255, 255, 0.3)';
        nextCard.style.height = '70px';
        nextCard.style.boxSizing = 'border-box';
        nextCard.style.boxShadow = `
          0 0 20px rgba(0, 255, 255, 0.2),
          inset 0 0 20px rgba(0, 255, 255, 0.1)
        `;
        nextCard.style.position = 'relative';
        nextCard.style.overflow = 'hidden';
        
        // Efeito scanline
        const scanline = document.createElement('div');
        scanline.style.position = 'absolute';
        scanline.style.top = '0';
        scanline.style.left = '0';
        scanline.style.width = '100%';
        scanline.style.height = '100%';
        scanline.style.background = `
          repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0, 255, 255, 0.1) 2px,
            rgba(0, 255, 255, 0.1) 4px
          )
        `;
        
        const positionBadge = document.createElement('span');
        positionBadge.textContent = `${team.position}`;
        positionBadge.style.fontSize = '24px';
        positionBadge.style.fontWeight = 'bold';
        positionBadge.style.color = '#00ffff';
        positionBadge.style.minWidth = '60px';
        positionBadge.style.height = '40px';
        positionBadge.style.display = 'flex';
        positionBadge.style.alignItems = 'center';
        positionBadge.style.justifyContent = 'center';
        positionBadge.style.background = 'rgba(0, 255, 255, 0.2)';
        positionBadge.style.borderRadius = '20px';
        positionBadge.style.border = '1px solid rgba(0, 255, 255, 0.5)';
        positionBadge.style.textShadow = '0 0 10px rgba(0, 255, 255, 0.8)';
        positionBadge.style.zIndex = '2';
        positionBadge.style.position = 'relative';
        
        const teamName = document.createElement('span');
        teamName.textContent = team.team;
        teamName.style.flex = '1';
        teamName.style.marginLeft = '20px';
        teamName.style.fontSize = '20px';
        teamName.style.color = '#ffffff';
        teamName.style.fontWeight = '500';
        teamName.style.textShadow = '0 0 10px rgba(255, 255, 255, 0.3)';
        teamName.style.zIndex = '2';
        teamName.style.position = 'relative';
        
        const points = document.createElement('span');
        points.textContent = `${team.points} pts`;
        points.style.fontSize = '20px';
        points.style.fontWeight = 'bold';
        points.style.color = '#ff00ff';
        points.style.textShadow = '0 0 10px rgba(255, 0, 255, 0.8)';
        points.style.zIndex = '2';
        points.style.position = 'relative';
        
        nextCard.appendChild(scanline);
        nextCard.appendChild(positionBadge);
        nextCard.appendChild(teamName);
        nextCard.appendChild(points);
        nextList.appendChild(nextCard);
      });
      
      nextSection.appendChild(nextTitle);
      nextSection.appendChild(nextList);
      
      tempContainer.appendChild(header);
      tempContainer.appendChild(podiumSection);
      tempContainer.appendChild(nextSection);
      
      // Adicionar ao DOM temporariamente
      document.body.appendChild(tempContainer);
      
      // Capturar imagem
      const canvas = await html2canvas(tempContainer, {
        width: 1080,
        height: 1920,
        scale: 1,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#1a1a2e'
      });
      
      // Remover elemento temporário
      document.body.removeChild(tempContainer);
      
      // Baixar imagem
      const link = document.createElement('a');
      link.download = `ranking_podium_${sanitizeFileName(championshipName)}_${getCurrentDateTime()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      toast({
        title: "PNG Pódio Exportado!",
        description: `Imagem do pódio com TOP 10 foi baixada com sucesso.`,
      });
      
    } catch (error) {
      console.error('Erro ao exportar PNG Pódio:', error);
      toast({
        title: "Erro na Exportação",
        description: "Não foi possível exportar a imagem do pódio. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsExportingPNGPodium(false);
    }
  };

  return (
    <div className="flex gap-3 items-center flex-wrap">
      <Button
        onClick={exportToPDF}
        disabled={isExportingPDF || isExportingPNGComplete || isExportingPNGPodium}
        variant="outline"
        className="flex items-center gap-2 bg-gradient-dark border-primary/20 hover:border-primary/50 text-foreground"
      >
        {isExportingPDF ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FileText className="h-4 w-4" />
        )}
        {isExportingPDF ? 'Exportando...' : 'Exportar PDF'}
      </Button>
      
      <Button
        onClick={exportToPNGComplete}
        disabled={isExportingPDF || isExportingPNGComplete || isExportingPNGPodium}
        variant="outline"
        className="flex items-center gap-2 bg-gradient-dark border-accent/20 hover:border-accent/50 text-foreground"
      >
        {isExportingPNGComplete ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Image className="h-4 w-4" />
        )}
        {isExportingPNGComplete ? 'Exportando...' : 'PNG Completo'}
      </Button>
      
      <Button
        onClick={exportToPNGPodium}
        disabled={isExportingPDF || isExportingPNGComplete || isExportingPNGPodium}
        variant="outline"
        className="flex items-center gap-2 bg-gradient-dark border-yellow-500/20 hover:border-yellow-500/50 text-foreground"
      >
        {isExportingPNGPodium ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Trophy className="h-4 w-4" />
        )}
        {isExportingPNGPodium ? 'Exportando...' : 'PNG Pódio'}
      </Button>
      
      <div className="text-xs text-muted-foreground ml-2">
        <div>PDF: Formato A4 para impressão</div>
        <div>PNG Completo: Todos os times (1080x1920)</div>
        <div>PNG Pódio: Top 10 com destaque (1080x1920)</div>
      </div>
    </div>
  );
}