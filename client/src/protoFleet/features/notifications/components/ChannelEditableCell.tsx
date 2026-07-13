interface ChannelEditableCellProps {
  value: string;
}

const ChannelEditableCell = ({ value }: ChannelEditableCellProps) => <span className="truncate">{value}</span>;

export default ChannelEditableCell;
