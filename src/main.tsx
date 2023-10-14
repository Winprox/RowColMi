import { ButtonHTMLAttributes, FC, Fragment, InputHTMLAttributes, useCallback, useEffect, useMemo, useState } from 'react'; // prettier-ignore
import { createRoot } from 'react-dom/client';
import { useFilePicker } from 'use-file-picker';
import './app.css';

const FILES = ['col', 'row', 'mi'];

const App = () => {
  const [dataDivider, setDataDivider] = useState('\n');
  const [reverseCompare, setReverseCompare] = useState(false);
  const [minMax, setMinMax] = useState(
    Array.from({ length: FILES.length - 1 }).map((_, i) => (i === 0 ? [0, 112] : [113, 453]))
  );

  const [data, setData] = useState<number[][]>(Array.from({ length: FILES.length }).map(() => []));
  const [result, setResult] = useState<number[][]>([]);

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
      const compare = v.every((v, i) => (i < minMax.length ? between(v, minMax[i][0], minMax[i][1]) : true));
      const hardcodeCompare = between(v[0], minMax[1][0], minMax[1][1]) && between(v[1], minMax[0][0], minMax[0][1]);
      return compare || (reverseCompare && hardcodeCompare);
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
  }, [dataExists, dataValid, dataLengthEqual, data, reverseCompare, minMax]);

  const downloadResult = useCallback(() => {
    result.forEach((v, i) => downloadData(v.join(dataDivider), FILES[i]));
  }, [result, dataDivider]);

  return (
    <div className='flex h-screen w-screen select-none flex-col items-start gap-4 overflow-y-auto bg-neutral-800 p-4 text-neutral-200'>
      <div className='flex gap-2'>
        Divider
        <Input
          defaultValue={JSON.stringify(dataDivider)}
          onChange={(e) => setDataDivider(JSON.parse(e.target.value))}
        />
      </div>
      {FILES.map((v, i) => (
        <Fragment key={v}>
          {i < minMax.length && (
            <div className='flex gap-2'>
              {`${v.toUpperCase()} Between`}
              <Input
                type='number'
                defaultValue={minMax[i][0]}
                onChange={(e) =>
                  setMinMax((v) => {
                    v[i][0] = +e.target.value;
                    return [...v];
                  })
                }
              />
              –
              <Input
                type='number'
                defaultValue={minMax[i][1]}
                onChange={(e) =>
                  setMinMax((v) => {
                    v[i][1] = +e.target.value;
                    return [...v];
                  })
                }
              />
            </div>
          )}
        </Fragment>
      ))}
      <label className='flex cursor-pointer items-center gap-2'>
        <input type='checkbox' defaultChecked={reverseCompare} onChange={(e) => setReverseCompare(e.target.checked)} />
        Reverse Compare
      </label>
      <div className='text-blue-600'>Comparisons Are Inclusive</div>
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
            <div key={v}>{data[i]?.length > 0 ? `✅ ${data[i].length} Entries` : ''}</div>
          ))}
        </div>
      </div>
      <div className='text-red-600'>
        {!dataExists && <div>No Data</div>}
        {!dataLengthEqual && <div>Arrays Not Equal</div>}
        {!dataValid && <div>Data Not Valid</div>}
      </div>
      {result.length > 0 && (
        <div className='flex gap-2'>
          <Button onClick={downloadResult}>Download RESULT</Button>
          {`✅ ${result[0].length} Entries`}
        </div>
      )}
    </div>
  );
};

const Input: FC<InputHTMLAttributes<HTMLInputElement>> = ({ className, ...p }) => (
  <input className={['w-20 rounded-md border-[1px] bg-neutral-800 px-1 outline-none', className].join(' ')} {...p} />
);

const Button: FC<ButtonHTMLAttributes<HTMLButtonElement>> = ({ className, ...p }) => (
  <button
    className={[
      'rounded-md border-[1px] px-1 transition-all hover:bg-neutral-200 hover:text-neutral-800',
      className
    ].join(' ')}
    {...p}
  />
);

const Picker: FC<{ title: string; dataDivider: string; onData: (data: number[]) => void }> = ({
  title,
  dataDivider,
  onData
}) => {
  const picker = useFilePicker({ accept: '.txt', multiple: false });

  useEffect(() => {
    const content = picker.filesContent[0]?.content;
    if (content) onData(content.split(dataDivider).map((v) => +v));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [picker.filesContent, dataDivider]);

  return <Button onClick={picker.openFilePicker}>{`Upload ${title}`}</Button>;
};

const between = (v: number, min: number, max: number) => v >= min && v <= max;
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
