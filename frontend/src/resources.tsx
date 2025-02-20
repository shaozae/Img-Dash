// resources.tsx
import { Gear, Notebook, ListBullets, Info, Chats } from '@phosphor-icons/react';

const resources = [
    {
        name: "images",
        list: "/images",
        icon: < ListBullets size={24} weight="bold" />,
        meta: { label: "VM Image" },             
      },
      {
        name: "details",
        list: "/details/:id",
        icon: <Info size={24} weight="bold" />,
        meta: { parent: "images", label: "Details"},
      },
      {
        name: "attach",
        list: "/attach/:id",
        icon: <Notebook size={24} weight="bold" />,
        meta: { parent: "images", label: "Context Book" },
      },
];

export default resources;