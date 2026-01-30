import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

export type FieldMapping = {
  dbField: string;
  excelField: string;
  label: string;
  required?: boolean;
  transform?: (value: any) => any;
};

interface BatchUploadButtonProps {
  title: string;
  description: string;
  fieldMappings: FieldMapping[];
  onUpload: (data: any[]) => Promise<void>;
  sampleData?: Record<string, string>[];
}

export function BatchUploadButton({
  title,
  description,
  fieldMappings,
  onUpload,
  sampleData,
}: BatchUploadButtonProps) {
  const [open, setOpen] = useState(false);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [fileName, setFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setErrors([]);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      // Map Excel data to database fields
      const mappedData: any[] = [];
      const parseErrors: string[] = [];

      jsonData.forEach((row: any, index) => {
        const mappedRow: any = {};
        let hasError = false;

        fieldMappings.forEach((mapping) => {
          const value = row[mapping.excelField];
          
          if (mapping.required && (value === undefined || value === null || value === "")) {
            parseErrors.push(`第 ${index + 2} 行: "${mapping.label}" 不能为空`);
            hasError = true;
            return;
          }

          if (value !== undefined && value !== null && value !== "") {
            mappedRow[mapping.dbField] = mapping.transform ? mapping.transform(value) : value;
          } else if (mapping.transform) {
            // Apply transform even for empty values (for defaults)
            mappedRow[mapping.dbField] = mapping.transform(value);
          }
        });

        if (!hasError && Object.keys(mappedRow).length > 0) {
          mappedData.push(mappedRow);
        }
      });

      setParsedData(mappedData);
      setErrors(parseErrors.slice(0, 10)); // Show first 10 errors

      if (mappedData.length === 0 && parseErrors.length > 0) {
        toast.error("文件解析失败，请检查格式");
      }
    } catch (err) {
      console.error("File parse error:", err);
      toast.error("文件解析失败");
      setErrors(["文件格式错误，请上传 Excel (.xlsx) 或 CSV 文件"]);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUpload = async () => {
    if (parsedData.length === 0) return;

    setIsUploading(true);
    try {
      await onUpload(parsedData);
      toast.success(`成功导入 ${parsedData.length} 条数据`);
      setOpen(false);
      setParsedData([]);
      setFileName("");
    } catch (err: any) {
      toast.error(err.message || "导入失败");
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = () => {
    const templateData = sampleData || [
      fieldMappings.reduce((acc, m) => ({ ...acc, [m.excelField]: `示例${m.label}` }), {}),
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "模板");
    XLSX.writeFile(wb, `${title}导入模板.xlsx`);
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="border-dashed"
      >
        <Upload className="w-4 h-4 mr-2" />
        批量上传
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card border-border max-w-3xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-primary" />
              {title}
            </DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
            {/* Field mapping reference */}
            <div className="bg-muted/50 rounded-lg p-3 space-y-2">
              <p className="text-sm font-medium">Excel 表头字段对照：</p>
              <div className="flex flex-wrap gap-2">
                {fieldMappings.map((m) => (
                  <Badge
                    key={m.dbField}
                    variant={m.required ? "default" : "outline"}
                    className={m.required ? "bg-primary" : ""}
                  >
                    {m.excelField}
                    {m.required && <span className="ml-1">*</span>}
                  </Badge>
                ))}
              </div>
              <Button variant="link" size="sm" className="p-0 h-auto" onClick={downloadTemplate}>
                下载模板文件
              </Button>
            </div>

            {/* File upload area */}
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileSelect}
                className="hidden"
                id="batch-file-input"
              />
              <label
                htmlFor="batch-file-input"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <Upload className="w-10 h-10 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  点击选择 Excel 文件 (.xlsx / .csv)
                </p>
                {fileName && (
                  <Badge variant="secondary" className="mt-2">
                    已选择: {fileName}
                  </Badge>
                )}
              </label>
            </div>

            {/* Errors */}
            {errors.length > 0 && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3">
                <p className="text-sm font-medium text-destructive flex items-center gap-1 mb-2">
                  <AlertCircle className="w-4 h-4" />
                  解析错误 ({errors.length} 条)
                </p>
                <ul className="text-xs text-destructive space-y-1">
                  {errors.map((err, i) => (
                    <li key={i}>• {err}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Preview table */}
            {parsedData.length > 0 && (
              <div className="flex-1 overflow-hidden flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-success" />
                    预览数据 ({parsedData.length} 条)
                  </p>
                </div>
                <ScrollArea className="flex-1 border border-border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border">
                        <TableHead className="w-12">#</TableHead>
                        {fieldMappings.slice(0, 5).map((m) => (
                          <TableHead key={m.dbField}>{m.label}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedData.slice(0, 10).map((row, i) => (
                        <TableRow key={i} className="border-border">
                          <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                          {fieldMappings.slice(0, 5).map((m) => (
                            <TableCell key={m.dbField} className="max-w-32 truncate">
                              {String(row[m.dbField] ?? "-")}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {parsedData.length > 10 && (
                    <p className="text-center text-xs text-muted-foreground py-2">
                      ... 还有 {parsedData.length - 10} 条数据
                    </p>
                  )}
                </ScrollArea>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button variant="outline" onClick={() => setOpen(false)}>
                取消
              </Button>
              <Button
                onClick={handleUpload}
                disabled={parsedData.length === 0 || isUploading}
                className="bg-primary hover:bg-primary/90"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    导入中...
                  </>
                ) : (
                  `确认导入 ${parsedData.length} 条`
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
