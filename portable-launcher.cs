using System;
using System.Diagnostics;
using System.IO;
using System.Windows.Forms;

internal static class PortableLauncher
{
    [STAThread]
    private static void Main()
    {
        string root = AppDomain.CurrentDomain.BaseDirectory;
        string script = Path.Combine(root, "Abrir Ultimate Emulator.cmd");
        if (!File.Exists(script))
        {
            MessageBox.Show("O iniciador do Ultimate Emulator não foi encontrado.\n\n" + script,
                "Ultimate Emulator", MessageBoxButtons.OK, MessageBoxIcon.Error);
            return;
        }

        try
        {
            Process.Start(new ProcessStartInfo
            {
                FileName = Environment.GetEnvironmentVariable("ComSpec") ?? "cmd.exe",
                Arguments = "/d /s /c \"\"" + script + "\"\"",
                WorkingDirectory = root,
                UseShellExecute = false,
                CreateNoWindow = true,
                WindowStyle = ProcessWindowStyle.Hidden
            });
        }
        catch (Exception error)
        {
            MessageBox.Show("Não foi possível iniciar o Ultimate Emulator.\n\n" + error.Message,
                "Ultimate Emulator", MessageBoxButtons.OK, MessageBoxIcon.Error);
        }
    }
}
