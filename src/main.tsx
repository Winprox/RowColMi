import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { useFilePicker } from 'use-file-picker';
import './app.css';

const FILES = ['row', 'col', 'mi'];

const App = () => {
  const [dataDivider, setDataDivider] = useState('\n');
  const [data, setData] = useState<number[][]>(Array.from({ length: FILES.length }).map(() => []));
  const [result, setResult] = useState<number[][]>([]);

  const [firstMin, setFirstMin] = useState(0);
  const [firstMax, setFirstMax] = useState(112);
  const [secondMin, setSecondMin] = useState(113);
  const [secondMax, setSecondMax] = useState(453);

  const dataExists = useMemo(() => data.find((v) => v.length), [data]);
  const dataValid = useMemo(() => data.every((v) => v.every((n) => isFinite(n))), [data]);
  const dataLengthEqual = useMemo(() => data.map((v) => v.length).every((v, _, arr) => v === arr[0]), [data]);

  useEffect(() => {
    if (!dataExists || !dataValid || !dataLengthEqual) return;

    let rows = [];
    for (let i = 0; i < data[0].length; i++) {
      const row = [];
      for (const j in FILES) row.push(data[j][i]);
      rows.push(row);
    }

    rows = rows.filter((v) => {
      const validByDirectOrder = between(v[0], firstMin, firstMax) && between(v[1], secondMin, secondMax);
      const validByReverseOrder = between(v[0], secondMin, secondMax) && between(v[1], firstMin, firstMax);
      return validByDirectOrder || validByReverseOrder;
    });

    setResult(
      rows.reduce(
        (acc: number[][], v) => {
          for (const i in FILES) acc[i].push(v[i]);
          return acc;
        },
        Array.from({ length: FILES.length }).map(() => [])
      )
    );
  }, [data, dataExists, dataValid, dataLengthEqual, firstMin, firstMax, secondMin, secondMax]);

  const downloadResult = useCallback(() => {
    result.forEach((v, i) => downloadData(v.join(dataDivider), FILES[i]));
  }, [result, dataDivider]);

  return (
    <div
      className={[
        'flex h-screen w-screen select-none flex-col items-start gap-4 p-4',
        'bg-neutral-800 text-neutral-200 [&_button]:transition-all',
        '[&_button]:rounded-md [&_button]:border-[1px] [&_button]:px-1',
        '[&_button:hover]:bg-neutral-200 [&_button:hover]:text-neutral-800',
        '[&_input]:bg-neutral-800 [&_input]:px-1 [&_input]:outline-none',
        '[&_input]:w-20 [&_input]:rounded-md [&_input]:border-[1px]'
      ].join(' ')}
    >
      <div className='flex gap-2'>
        Divider
        <input
          defaultValue={JSON.stringify(dataDivider)}
          onChange={(e) => setDataDivider(JSON.parse(e.target.value))}
        />
      </div>
      <div className='flex gap-2'>
        1st Between
        <input type='number' defaultValue={firstMin} onChange={(e) => setFirstMin(+e.target.value)} />
        –
        <input type='number' defaultValue={firstMax} onChange={(e) => setFirstMax(+e.target.value)} />
      </div>
      <div className='flex gap-2'>
        2nd Between
        <input type='number' defaultValue={secondMin} onChange={(e) => setSecondMin(+e.target.value)} />
        –
        <input type='number' defaultValue={secondMax} onChange={(e) => setSecondMax(+e.target.value)} />
      </div>
      <div className='text-blue-600'>Comparisons Are Non Inclusive</div>
      <div className='flex gap-2'>
        <div className='flex flex-col items-end gap-4'>
          {FILES.map((v, i) => (
            <Picker
              key={v}
              title={v.toUpperCase()}
              dataDivider={dataDivider}
              onData={(data) =>
                setData((v) => {
                  v[i] = data;
                  return [...v];
                })
              }
            />
          ))}
        </div>
        <div className='flex flex-col gap-4 [&_div]:h-[1.65rem]'>
          {FILES.map((v, i) => (
            <div key={v}>{data[i]?.length > 0 ? `✅ ${data[i].length} Entries` : '❌'}</div>
          ))}
        </div>
      </div>
      <div className='text-red-600'>
        {!dataExists && 'No Data'}
        {!dataLengthEqual && 'Arrays Not Equal'}
        {!dataValid && 'Data Not Valid'}
      </div>
      {result.length > 0 && (
        <div className='flex gap-2'>
          <button onClick={downloadResult}>Download RESULT</button>
          {`✅ ${result[0].length} Entries`}
        </div>
      )}
    </div>
  );
};

const Picker: FC<{ title: string; dataDivider: string; onData: (data: number[]) => void }> = ({
  title,
  dataDivider,
  onData
}) => {
  const picker = useFilePicker({ accept: '.txt', multiple: false });

  useEffect(() => {
    const content = picker.filesContent[0]?.content;
    if (content) onData(content.split(dataDivider).map((v) => +v));
  }, [picker.filesContent, dataDivider, onData]);

  return <button onClick={picker.openFilePicker}>{`Upload ${title}`}</button>;
};

const between = (v: number, min: number, max: number) => v > min && v < max;
const downloadData = (data: string, fileName: string) => {
  const el = document.createElement('a');
  const file = new Blob([data], { type: 'text/plain' });
  el.href = URL.createObjectURL(file);
  el.download = fileName;
  document.body.appendChild(el);
  el.click();
  el.remove();
};

createRoot(document.querySelector('#app')!).render(<App />);
