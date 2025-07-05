import React, { useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { UploadCloud } from 'lucide-react';
import GlitchText from '@/components/shared/GlitchText';

const InstallPanel = ({ adbState }) => {
  const { device, installApk, progress } = adbState;
  const fileInputRef = useRef(null);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      installApk(file);
    }
    event.target.value = '';
  };

  const handleButtonClick = () => {
    fileInputRef.current.click();
  };
  
  return (
    <Card className="cyber-card">
      <CardHeader>
        <CardTitle className="text-green-400 neon-text-green"><GlitchText text="Package Injector" /></CardTitle>
        <CardDescription className="text-cyan-300">Sideload .apk packages</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <input
          type="file"
          accept=".apk"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />
        <Button className="cyber-button w-full" onClick={handleButtonClick} disabled={!device || (progress.value > 0 && progress.value < 100)}>
          <UploadCloud className="w-4 h-4 mr-2" />
          Select & Inject Package
        </Button>
        {progress.value > 0 && (
          <div className="space-y-2">
            <Progress value={progress.value} className="w-full h-2 progress-bar-animated" />
            <p className="text-xs text-center text-cyan-300">{progress.message}</p>
          </div>
        )}
      </CardContent>
      <div className="corner-bottom-left"></div>
      <div className="corner-bottom-right"></div>
    </Card>
  );
};

export default InstallPanel;