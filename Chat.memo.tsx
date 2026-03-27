import { Chat as EthoraChat } from "@ethora/chat-component";
import { FC, Fragment, useMemo } from "react";

interface Props {
  roomJID: string;
  config: object;
}

export const ChatMemo: FC<Props> = ({ roomJID, config }) => {
  return useMemo(
    () => (
      <Fragment>
        <EthoraChat roomJID={roomJID} config={config} />
      </Fragment>
    ),
    [config, roomJID]
  );
};
