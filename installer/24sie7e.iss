; 24Sie7e - Inno Setup script (per-user install, wizard UI)
; Compile with: ISCC.exe 24sie7e.iss
; The onedir build must exist at ..\backend\dist\24sie7e\

#define AppName "24Sie7e"
#define AppVersion "0.1.0"
#define AppPublisher "Open 24Sie7e"
#define AppExeName "24sie7e.exe"
#define BuildDir "..\backend\dist\24sie7e"

[Setup]
AppId={{3A9F59F2-29E9-4E9A-9268-4BD847305294}
AppName={#AppName}
AppVersion={#AppVersion}
AppVerName={#AppName} {#AppVersion}
AppPublisher={#AppPublisher}
DefaultDirName={localappdata}\Programs\{#AppName}
DisableProgramGroupPage=yes
PrivilegesRequired=lowest
OutputDir=..\dist_installer
OutputBaseFilename=24Sie7eSetup
SetupIconFile=24sie7e.ico
UninstallDisplayIcon={app}\{#AppExeName}
UninstallDisplayName={#AppName}
Compression=lzma2/max
SolidCompression=yes
WizardStyle=modern
ArchitecturesAllowed=x64compatible
DisableDirPage=no
AllowNoIcons=yes

[Languages]
Name: "spanish"; MessagesFile: "compiler:Languages\Spanish.isl"

[Tasks]
Name: "desktopicon"; Description: "Crear un icono en el Escritorio"; GroupDescription: "Iconos adicionales:"; Flags: checkedonce
Name: "startup"; Description: "Iniciar {#AppName} al encender Windows"; GroupDescription: "Inicio automático:"; Flags: checkedonce

[Files]
Source: "{#BuildDir}\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\{#AppName}"; Filename: "{app}\{#AppExeName}"
Name: "{group}\Desinstalar {#AppName}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#AppName}"; Filename: "{app}\{#AppExeName}"; Tasks: desktopicon
Name: "{userstartup}\{#AppName}"; Filename: "{app}\{#AppExeName}"; Tasks: startup

[Run]
Filename: "{app}\{#AppExeName}"; Description: "Ejecutar {#AppName} ahora"; Flags: nowait postinstall skipifsilent

[UninstallDelete]
Type: filesandordirs; Name: "{app}\_internal"

[Code]
var
  DeleteData: Boolean;

procedure InitializeUninstallProgressForm();
var
  Msg: String;
begin
  DeleteData := False;
  if DirExists(ExpandConstant('{localappdata}\{#AppName}')) then
  begin
    Msg := '¿Querés borrar también los datos de {#AppName}?' + #13#10 +
           '(productos, ventas, stock: ' + ExpandConstant('{localappdata}\{#AppName}') + ')' + #13#10 + #13#10 +
           'Elegí "No" para conservarlos si vas a reinstalar.';
    DeleteData := MsgBox(Msg, mbConfirmation, MB_YESNO) = IDYES;
  end;
end;

procedure CurUninstallStepChanged(CurUninstallStep: TUninstallStep);
begin
  if (CurUninstallStep = usPostUninstall) and DeleteData then
    DelTree(ExpandConstant('{localappdata}\{#AppName}'), True, True, True);
end;
